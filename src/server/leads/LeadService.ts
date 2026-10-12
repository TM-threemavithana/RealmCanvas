/**
 * RealmCanvas Lead Service, Consent Enforcement & Duplicate Protection
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 3.3, Section 6.2, Section 8.2, Section 8.3)
 */

import type { TenantService } from "../tenancy/TenantService";
import type { ILeadRepository } from "./LeadRepository";
import type {
  Lead,
  LeadStatus,
  SubmitInquiryInput,
  InquiryConfirmation,
} from "./LeadSchema";

export const DEFAULT_DEDUPLICATION_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export class ConsentRequiredError extends Error {
  constructor(message = "Explicit marketing/contact consent is required to submit an inquiry.") {
    super(message);
    this.name = "ConsentRequiredError";
  }
}

export class InvalidLeadEmailError extends Error {
  constructor(message = "Invalid contact email address.") {
    super(message);
    this.name = "InvalidLeadEmailError";
  }
}

export class DuplicateInquiryError extends Error {
  constructor(message = "Duplicate inquiry detected. A request for this item was already submitted recently.") {
    super(message);
    this.name = "DuplicateInquiryError";
  }
}

export class LeadNotFoundError extends Error {
  constructor(message = "Lead not found in organization.") {
    super(message);
    this.name = "LeadNotFoundError";
  }
}

export function isValidEmail(email: string | undefined | null): boolean {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Computes a deterministic deduplication hash for an inquiry based on normalized contact and target.
 */
export function generateInquiryFingerprint(
  email: string,
  showroomId: string,
  productId?: string
): string {
  const normEmail = email.toLowerCase().trim();
  const normShowroom = showroomId.trim();
  const normProduct = (productId || "general").trim();
  return `${normEmail}::${normShowroom}::${normProduct}`;
}

/**
 * Basic XSS sanitization removing dangerous HTML tag characters.
 */
function sanitizeText(input: string): string {
  return input.replace(/[<>]/g, "").trim();
}

export class LeadService {
  constructor(
    private leadRepo: ILeadRepository,
    private tenantService: TenantService
  ) {}

  /**
   * Public inquiry submission endpoint.
   * Enforces explicit opt-in consent and rapid duplicate spam protection (Section 8.2 & 8.3).
   */
  public async submitInquiry(
    input: SubmitInquiryInput,
    deduplicationWindowMs: number = DEFAULT_DEDUPLICATION_WINDOW_MS,
    nowTimestamp: number = Date.now()
  ): Promise<InquiryConfirmation> {
    // 1. Explicit Consent Check
    if (input.consent !== true) {
      throw new ConsentRequiredError();
    }

    // 2. Email Validation
    if (!isValidEmail(input.contact.email)) {
      throw new InvalidLeadEmailError(`Email "${input.contact.email}" is invalid.`);
    }

    // 3. Duplicate Protection Check
    const fingerprint = generateInquiryFingerprint(
      input.contact.email,
      input.showroomId,
      input.productId
    );

    const sinceDate = new Date(nowTimestamp - deduplicationWindowMs);
    const existingRecent = await this.leadRepo.findRecentLeadByFingerprint(fingerprint, sinceDate);

    if (existingRecent) {
      throw new DuplicateInquiryError();
    }

    // 4. Sanitize and Persist
    const lead = await this.leadRepo.createLead({
      organizationId: input.organizationId,
      showroomId: input.showroomId,
      productId: input.productId,
      contact: {
        name: sanitizeText(input.contact.name),
        email: input.contact.email.toLowerCase().trim(),
        phone: input.contact.phone ? sanitizeText(input.contact.phone) : undefined,
        notes: input.contact.notes ? sanitizeText(input.contact.notes) : undefined,
      },
      consent: true,
      status: "new",
      submissionFingerprint: fingerprint,
      createdAt: new Date(nowTimestamp),
    });

    return {
      leadId: lead.id,
      status: lead.status,
      createdAt: lead.createdAt,
    };
  }

  /**
   * Lists inquiries for an organization.
   * Requires "analyst" role or higher.
   */
  public async listLeads(
    actorUserId: string,
    organizationId: string,
    filter?: { showroomId?: string; status?: LeadStatus }
  ): Promise<Lead[]> {
    await this.tenantService.assertTenantAccess(actorUserId, organizationId, "analyst");
    return this.leadRepo.listLeadsByOrg(organizationId, filter);
  }

  /**
   * Updates lead qualification / engagement status.
   * Requires "editor" or "owner" role.
   */
  public async updateLeadStatus(
    actorUserId: string,
    organizationId: string,
    leadId: string,
    newStatus: LeadStatus
  ): Promise<Lead> {
    await this.tenantService.assertTenantAccess(actorUserId, organizationId, "editor");

    const updated = await this.leadRepo.updateLeadStatus(organizationId, leadId, newStatus);
    if (!updated) {
      throw new LeadNotFoundError(`Lead "${leadId}" not found in organization "${organizationId}".`);
    }

    return updated;
  }
}
