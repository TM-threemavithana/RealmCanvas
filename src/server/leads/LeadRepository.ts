/**
 * RealmCanvas Lead Repository Interface & In-Memory Implementation
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 6.2, Section 8.2, Section 8.3)
 */

import type { Lead, LeadStatus } from "./LeadSchema";

export interface ILeadRepository {
  createLead(input: Omit<Lead, "id" | "createdAt" | "updatedAt"> & { createdAt?: Date }): Promise<Lead>;
  findRecentLeadByFingerprint(fingerprint: string, sinceDate: Date): Promise<Lead | null>;
  findLeadById(organizationId: string, leadId: string): Promise<Lead | null>;
  listLeadsByOrg(organizationId: string, filter?: { showroomId?: string; status?: LeadStatus }): Promise<Lead[]>;
  updateLeadStatus(organizationId: string, leadId: string, newStatus: LeadStatus): Promise<Lead | null>;
  clear(): Promise<void>;
}

export class InMemoryLeadRepository implements ILeadRepository {
  private leads = new Map<string, Lead>();

  public async createLead(input: Omit<Lead, "id" | "createdAt" | "updatedAt"> & { createdAt?: Date }): Promise<Lead> {
    const timestamp = input.createdAt ?? new Date();
    const lead: Lead = {
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      showroomId: input.showroomId,
      productId: input.productId,
      contact: {
        name: input.contact.name.trim(),
        email: input.contact.email.toLowerCase().trim(),
        phone: input.contact.phone ? input.contact.phone.trim() : undefined,
        notes: input.contact.notes ? input.contact.notes.trim() : undefined,
      },
      consent: input.consent,
      status: input.status,
      submissionFingerprint: input.submissionFingerprint,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.leads.set(lead.id, lead);
    return lead;
  }

  public async findRecentLeadByFingerprint(fingerprint: string, sinceDate: Date): Promise<Lead | null> {
    for (const lead of this.leads.values()) {
      if (lead.submissionFingerprint === fingerprint && lead.createdAt >= sinceDate) {
        return lead;
      }
    }
    return null;
  }

  public async findLeadById(organizationId: string, leadId: string): Promise<Lead | null> {
    const lead = this.leads.get(leadId);
    if (!lead || lead.organizationId !== organizationId) {
      return null;
    }
    return lead;
  }

  public async listLeadsByOrg(
    organizationId: string,
    filter?: { showroomId?: string; status?: LeadStatus }
  ): Promise<Lead[]> {
    const results: Lead[] = [];
    for (const lead of this.leads.values()) {
      if (lead.organizationId === organizationId) {
        if (filter?.showroomId && lead.showroomId !== filter.showroomId) {
          continue;
        }
        if (filter?.status && lead.status !== filter.status) {
          continue;
        }
        results.push(lead);
      }
    }
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public async updateLeadStatus(
    organizationId: string,
    leadId: string,
    newStatus: LeadStatus
  ): Promise<Lead | null> {
    const lead = this.leads.get(leadId);
    if (!lead || lead.organizationId !== organizationId) {
      return null;
    }

    const updated: Lead = {
      ...lead,
      status: newStatus,
      updatedAt: new Date(),
    };

    this.leads.set(leadId, updated);
    return updated;
  }

  public async clear(): Promise<void> {
    this.leads.clear();
  }
}
