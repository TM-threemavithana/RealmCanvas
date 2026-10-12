# RealmCanvas Pilot Operations Guide
*Commercial Interactive 3D Showroom Platform*  
*Standard Operating Procedure & Pilot Deployment Manual*

---

## 1. Overview & Architecture

RealmCanvas bridges high-fidelity architectural 3D product spaces with measurable e-commerce outcomes. The platform operates as a modular monolith Next.js application adhering strictly to:
- **Zero Cross-Tenant Data Leakage:** Every admin data action enforces server-side membership and role checks.
- **Fixed World Slot Placement:** No arbitrary positioning or physics glitches; products map to predetermined celestial pavilion pedestals.
- **Atomic, Immutable Publishing:** Public visitors only access finalized publication snapshots; drafts and revisions are completely walled off.
- **Guaranteed Accessible Fallback:** A complete non-WebGL 2D catalog (`/catalog`) operates in parallel with WCAG 2.2 AA compliance.

---

## 2. Organization & Role Hierarchy (Section 8.3)

Every merchant belongs to an isolated `Organization`. User permissions follow a strict three-tier hierarchy:

| Role | Permissions | Typical User |
|---|---|---|
| **Owner** | Full administrative rights, tenant management, member invite, atomic publishing | Brand Founder / E-Commerce Director |
| **Editor** | Catalog management, draft editing, slot placement assignment, lead status updates | 3D Visual Merchandiser / Catalog Specialist |
| **Analyst** | Read-only access to analytics dashboards, metrics aggregations, and lead listings | Marketing Analyst / Growth Lead |

*Note: Outsiders and unauthorized users are blocked with `TenantAccessDeniedError` (HTTP 403).*

---

## 3. Product Catalog Management

### 3.1 Registering Products
Products must be registered before being assigned to world pedestals.
```typescript
const product = await catalogService.createProduct(actorId, orgId, {
  name: "Aurora Wireless Headphones",
  slug: "aurora-headphones",
  summary: "Flagship acoustic headphones with planar magnetic drivers.",
  specifications: [
    { label: "Driver Type", value: "40mm Planar Magnetic" },
    { label: "Battery Life", value: "38 Hours ANC Enabled" },
    { label: "Connectivity", value: "Ultra-low Latency Lossless + BT 5.4" }
  ],
  cta: {
    label: "Order Official Aurora",
    url: "https://store.brand.com/products/aurora" // Must be valid HTTPS
  }
});
```

### 3.2 CTA Security Policy
In accordance with Section 10.1 of the Master Specification:
- All outbound CTA URLs must use the **HTTPS** scheme.
- Internal relative URLs (e.g., `/catalog`, `/inquire`) are permitted.
- Insecure schemes (`http:`, `javascript:`, `data:`, `file:`) are strictly rejected at the schema level.

---

## 4. Fixed World Slot Allocation (`celestial-tech-pavilion-v1`)

The pilot flagship template features 6 predetermined, acoustically and architecturally designed slots:

| Slot Key | Zone | Description | Default Interaction |
|---|---|---|---|
| `featured-hero` | Arrival Portal | Monolithic pedestal under entrance arch | `inspect_product` |
| `gallery-01` | Acoustic Gallery | Curved promenade entry pedestal | `inspect_product` |
| `gallery-02` | Acoustic Gallery | Promenade secondary showcase | `inspect_product` |
| `gallery-03` | Acoustic Gallery | Promenade tertiary showcase | `inspect_product` |
| `gallery-04` | Acoustic Gallery | Promenade exit showcase | `inspect_product` |
| `lab-hero` | Product Lab | Spotlighted exploded-rig platform | `play_feature_demo` |

### 4.1 Placement Validation & Scale Bounds
- **Scale Bounds:** Pedestal scale must fall between `0.5x` and `2.0x` (enforced server-side via `MIN_PLACEMENT_SCALE` and `MAX_PLACEMENT_SCALE`).
- **Organization Ownership:** All placed products must belong to the active organization; cross-tenant references throw `PublishValidationError`.

---

## 5. Draft Concurrency & Atomic Publishing

Publishing follows an optimistic concurrency control protocol:
1. **Draft Edit:** An Editor makes placement adjustments against a draft revision holding a concurrency token (`revision_number`).
2. **Conflict Detection:** If another Editor has incremented the revision number, the server throws `RevisionConflictError` (HTTP 409), preventing silent overwrites.
3. **Atomic Publication:** When validated, the server compiles the `PublicSceneManifest`, persists an immutable snapshot in `publications`, and updates `active_publication_id` in a single atomic transaction.

---

## 6. Public Ingestion APIs

### 6.1 Lead Ingestion (`POST /api/v1/public/leads`)
Visitors can submit quote requests or demo inquiries:
```http
POST /api/v1/public/leads
Content-Type: application/json

{
  "organizationId": "org_uuid",
  "showroomId": "showroom_01",
  "productId": "prod_aurora",
  "contact": {
    "name": "Marcus Vance",
    "email": "marcus@example.com",
    "notes": "Interested in enterprise wholesale pricing."
  },
  "consent": true
}
```
**Controls & Safeguards:**
- **Explicit Consent:** Submissions without `consent: true` are rejected with `CONSENT_REQUIRED` (HTTP 400).
- **Duplicate Protection:** Repeat submissions with the same fingerprint (`email + showroom + product`) within 10 minutes return `DUPLICATE_INQUIRY` (HTTP 409).
- **XSS Stripping:** Contact names, phone numbers, and notes are sanitized to remove script and HTML markup.

### 6.2 Privacy-Preserving Analytics (`POST /api/v1/public/events`)
Events are sent in non-blocking batches:
```http
POST /api/v1/public/events
Content-Type: application/json

{
  "organizationId": "org_uuid",
  "events": [
    {
      "showroomId": "showroom_01",
      "eventType": "product_inspected",
      "eventData": { "productId": "prod_aurora", "slotKey": "featured-hero" }
    }
  ]
}
```
**Allowlisted Event Types (11 total):**
`landing_viewed`, `experience_entered`, `scene_ready`, `zone_visited`, `product_inspected`, `variant_selected`, `cta_clicked`, `lead_form_opened`, `lead_submitted`, `fallback_entered`, `graphics_error`.

**Privacy Guarantees:**
- Prohibited PII (`email`, `name`, `phone`, `ip`, `search`) is rejected on ingest.
- Raw visitor session tokens are immediately hashed via SHA-256 (`sessionTokenHash`).
- Ingestion errors are non-blocking and return HTTP 202 Accepted.

---

## 7. Pilot Checklist & Verification Routine

Before launching an external pilot showcase:
1. Verify 2D fallback catalog: Visit `/catalog` and ensure all products, specs, and CTAs render without WebGL.
2. Verify reduced-motion preferences: Ensure instantaneous camera transitions under `prefers-reduced-motion: reduce`.
3. Check Merchant Studio: Visit `/studio` to inspect slot allocations, metrics, and lead status.
4. Run automated test suite:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```
