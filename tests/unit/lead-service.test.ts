import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryTenantRepository } from "@/server/tenancy/TenantRepository";
import {
  TenantService,
  TenantAccessDeniedError,
  InsufficientRoleError,
} from "@/server/tenancy/TenantService";
import { InMemoryLeadRepository } from "@/server/leads/LeadRepository";
import {
  LeadService,
  ConsentRequiredError,
  InvalidLeadEmailError,
  DuplicateInquiryError,
} from "@/server/leads/LeadService";
import type { Organization, User } from "@/server/db/schema";

describe("Lead Workflow & Duplicate Protection (RC-016)", () => {
  let tenantRepo: InMemoryTenantRepository;
  let tenantService: TenantService;
  let leadRepo: InMemoryLeadRepository;
  let leadService: LeadService;

  let alice: User;
  let bob: User;
  let charlie: User;

  let acmeOrg: Organization;
  let betaOrg: Organization;

  beforeEach(async () => {
    tenantRepo = new InMemoryTenantRepository();
    tenantService = new TenantService(tenantRepo);
    leadRepo = new InMemoryLeadRepository();
    leadService = new LeadService(leadRepo, tenantService);

    alice = await tenantRepo.createUser({
      authSubject: "auth0|alice",
      email: "alice@acme.com",
      displayName: "Alice Owner",
    });

    bob = await tenantRepo.createUser({
      authSubject: "auth0|bob",
      email: "bob@acme.com",
      displayName: "Bob Editor",
    });

    charlie = await tenantRepo.createUser({
      authSubject: "auth0|charlie",
      email: "charlie@acme.com",
      displayName: "Charlie Analyst",
    });

    const { organization: acme } = await tenantService.createTenant(alice.id, {
      name: "Acme Sound Labs",
      slug: "acme-sound",
    });
    acmeOrg = acme;

    const { organization: beta } = await tenantService.createTenant(alice.id, {
      name: "Beta Acoustics",
      slug: "beta-acoustics",
    });
    betaOrg = beta;

    await tenantService.addMember(alice.id, acmeOrg.id, bob.id, "editor");
    await tenantService.addMember(alice.id, acmeOrg.id, charlie.id, "analyst");
  });

  describe("Inquiry Submission & Consent Verification", () => {
    it("successfully creates an inquiry when given valid contact data and consent", async () => {
      const confirmation = await leadService.submitInquiry({
        organizationId: acmeOrg.id,
        showroomId: "showroom_01",
        productId: "prod_aurora",
        contact: {
          name: "John Visitor",
          email: "john@example.com",
          phone: "+1 555-0199",
          notes: "Interested in bespoke studio customization.",
        },
        consent: true,
      });

      expect(confirmation.leadId).toBeTruthy();
      expect(confirmation.status).toBe("new");
      expect(confirmation.createdAt).toBeInstanceOf(Date);

      const leads = await leadService.listLeads(alice.id, acmeOrg.id);
      expect(leads.length).toBe(1);
      expect(leads[0].contact.name).toBe("John Visitor");
      expect(leads[0].contact.email).toBe("john@example.com");
      expect(leads[0].consent).toBe(true);
    });

    it("rejects inquiry with ConsentRequiredError when consent is false", async () => {
      await expect(
        leadService.submitInquiry({
          organizationId: acmeOrg.id,
          showroomId: "showroom_01",
          contact: {
            name: "No Consent User",
            email: "noconsent@example.com",
          },
          consent: false,
        })
      ).rejects.toThrowError(ConsentRequiredError);
    });

    it("rejects invalid contact email formats with InvalidLeadEmailError", async () => {
      const invalidEmails = ["not-an-email", "user@", "@domain.com", "", "plainaddress"];

      for (const badEmail of invalidEmails) {
        await expect(
          leadService.submitInquiry({
            organizationId: acmeOrg.id,
            showroomId: "showroom_01",
            contact: {
              name: "Invalid Email User",
              email: badEmail,
            },
            consent: true,
          })
        ).rejects.toThrowError(InvalidLeadEmailError);
      }
    });

    it("sanitizes HTML/script tags from name and notes", async () => {
      await leadService.submitInquiry({
        organizationId: acmeOrg.id,
        showroomId: "showroom_01",
        productId: "prod_aurora",
        contact: {
          name: "<script>alert('xss')</script>Jane Doe",
          email: "jane@example.com",
          notes: "<b>VIP customer</b>",
        },
        consent: true,
      });

      const leads = await leadService.listLeads(alice.id, acmeOrg.id);
      expect(leads[0].contact.name).toBe("scriptalert('xss')/scriptJane Doe");
      expect(leads[0].contact.notes).toBe("bVIP customer/b");
    });
  });

  describe("Duplicate Inquiry Protection (Section 8.2 & Section 8.3)", () => {
    it("blocks rapid repeat submissions within the 10-minute deduplication window", async () => {
      const initialTime = 1000000;

      // 1. Initial submission succeeds
      await leadService.submitInquiry(
        {
          organizationId: acmeOrg.id,
          showroomId: "showroom_01",
          productId: "prod_aurora",
          contact: {
            name: "John Visitor",
            email: "john@example.com",
          },
          consent: true,
        },
        10 * 60 * 1000,
        initialTime
      );

      // 2. Second submission 2 minutes later for SAME product -> BLOCKED
      await expect(
        leadService.submitInquiry(
          {
            organizationId: acmeOrg.id,
            showroomId: "showroom_01",
            productId: "prod_aurora",
            contact: {
              name: "John Visitor",
              email: "john@example.com",
            },
            consent: true,
          },
          10 * 60 * 1000,
          initialTime + 2 * 60 * 1000
        )
      ).rejects.toThrowError(DuplicateInquiryError);

      // 3. Submission for DIFFERENT product with same email succeeds
      const diffProductConfirmation = await leadService.submitInquiry(
        {
          organizationId: acmeOrg.id,
          showroomId: "showroom_01",
          productId: "prod_titanium_monitor",
          contact: {
            name: "John Visitor",
            email: "john@example.com",
          },
          consent: true,
        },
        10 * 60 * 1000,
        initialTime + 2 * 60 * 1000
      );
      expect(diffProductConfirmation.leadId).toBeTruthy();

      // 4. Submission after 10-minute window expires (11 minutes later) succeeds
      const afterWindowConfirmation = await leadService.submitInquiry(
        {
          organizationId: acmeOrg.id,
          showroomId: "showroom_01",
          productId: "prod_aurora",
          contact: {
            name: "John Visitor",
            email: "john@example.com",
          },
          consent: true,
        },
        10 * 60 * 1000,
        initialTime + 11 * 60 * 1000
      );
      expect(afterWindowConfirmation.leadId).toBeTruthy();
    });
  });

  describe("Multi-Tenancy Isolation & Role Hierarchy", () => {
    it("strictly isolates lead records across organizations", async () => {
      // Create lead in Acme
      await leadService.submitInquiry({
        organizationId: acmeOrg.id,
        showroomId: "showroom_acme",
        contact: { name: "Acme Lead", email: "lead@acme.com" },
        consent: true,
      });

      // Create lead in Beta
      await leadService.submitInquiry({
        organizationId: betaOrg.id,
        showroomId: "showroom_beta",
        contact: { name: "Beta Lead", email: "lead@beta.com" },
        consent: true,
      });

      // Bob (member of Acme, not Beta) can read Acme leads
      const acmeLeads = await leadService.listLeads(bob.id, acmeOrg.id);
      expect(acmeLeads.length).toBe(1);

      // Bob attempts to read Beta leads -> BLOCKED
      await expect(
        leadService.listLeads(bob.id, betaOrg.id)
      ).rejects.toThrowError(TenantAccessDeniedError);
    });

    it("allows Editor to update status, but blocks Analyst (InsufficientRoleError)", async () => {
      const confirmation = await leadService.submitInquiry({
        organizationId: acmeOrg.id,
        showroomId: "showroom_acme",
        contact: { name: "Prospect", email: "prospect@acme.com" },
        consent: true,
      });

      // Charlie (Analyst) attempts to update status -> BLOCKED
      await expect(
        leadService.updateLeadStatus(charlie.id, acmeOrg.id, confirmation.leadId, "contacted")
      ).rejects.toThrowError(InsufficientRoleError);

      // Bob (Editor) successfully updates status
      const updated = await leadService.updateLeadStatus(
        bob.id,
        acmeOrg.id,
        confirmation.leadId,
        "contacted"
      );
      expect(updated.status).toBe("contacted");
    });
  });
});
