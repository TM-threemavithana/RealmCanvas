/**
 * RealmCanvas Leads & Conversion Domain Schema
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 3.3, Section 6.2, Section 8.2, Section 8.3)
 */

export const LEAD_STATUSES = ["new", "contacted", "qualified", "closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface LeadContact {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}

export interface Lead {
  id: string; // UUID PK
  organizationId: string; // FK -> organizations.id
  showroomId: string; // FK -> showrooms.id
  productId?: string; // FK -> products.id (optional)
  contact: LeadContact;
  consent: boolean; // Explicit opt-in flag
  status: LeadStatus;
  submissionFingerprint: string; // Deduplication hash
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmitInquiryInput {
  organizationId: string;
  showroomId: string;
  productId?: string;
  contact: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
  };
  consent: boolean;
}

export interface InquiryConfirmation {
  leadId: string;
  status: LeadStatus;
  createdAt: Date;
}
