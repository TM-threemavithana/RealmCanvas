---
title: "REALMCANVAS"
subtitle: "Commercial Immersive 3D Showroom Platform | Master Product & Engineering Specification"
author: "Implementation Blueprint for Antigravity IDE"
date: "12 October 2026"
lang: en
---

![RealmCanvas cover](realmcanvas_assets/cover.png){ width=6.65in }

**DOCUMENT AT A GLANCE** - Commercial immersive 3D showrooms | Product vision | PRD & SRS | 3D design | Architecture | Database | API | Security | Antigravity implementation | Testing | Launch

## Contents

| Strategy and product | Engineering and delivery |
|---|---|
| 1 Executive summary | 12 Local environment and Antigravity |
| 2 Audience and business validation | 13 Copy/paste implementation prompts |
| 3 Functional requirements | 14 Milestones and roadmap |
| 4 3D art bible and world design | 15 Tests and traceability |
| 5 Quality requirements | 16 Deployment and operations |
| 6 Technical architecture | 17 Risks and gates |
| 7 State machines and renderer | 18 Sprint backlog and DoD |
| 8 Database and tenancy | 19 Open questions |
| 9 Public and admin APIs | 20 Glossary |
| 10 Security and privacy | 21 Start guide for Antigravity |
| 11 Asset pipeline | 22 References and verification |

> **Document classification:** Project planning / implementation specification  
> **Revision:** 1.0 (proposed baseline)  
> **Product name:** RealmCanvas (working name; trademark and domain clearance pending)  
> **Status:** Ready for discovery and vertical-slice development; business assumptions unvalidated  
> **How to use:** Place this Markdown file in your Antigravity repository at `docs/REALMCANVAS_MASTER_SPEC.md`. Read Section 21 before asking an AI agent to make changes.

# 1. Executive Summary and Decision Record

## 1.1 The product

RealmCanvas is a **browser-based platform for premium, interactive 3D commercial showrooms**. It has two product surfaces: (1) **RealmCanvas Experience**, the immersive customer-facing showroom, and (2) **RealmCanvas Studio**, the authenticated administration interface where brands configure products, brand assets, showroom content, publishing and engagement reporting.

The flagship template is **Celestial Tech Pavilion**: a sophisticated architectural world above clouds, with a dramatic arrival space, discovery gallery, product lab and conversion lounge. It preserves the beauty and exploration of the earlier AETHER concept while replacing fantasy quests with useful commercial tasks: product discovery, inspection, feature demonstration and conversion.

**Mission:** Make premium immersive product experiences accessible, maintainable and measurable for brands that cannot justify building a bespoke 3D application from scratch.

**Primary user:** A visitor exploring a product in a branded showroom. **Economic buyer:** A brand's marketing/e-commerce lead or a creative agency managing client campaigns.

**Commercial hypothesis:** For product categories where visual inspection and feature explanation matter, a polished 3D experience may earn enough incremental leads, engagement or brand value to justify a setup fee and ongoing subscription. This is a hypothesis, **not a demonstrated ROI claim**.

## 1.2 Product boundaries and decisions

| Decision | Baseline | Rationale |
|---|---|---|
| Initial niche | Premium consumer electronics / design-forward tech products | Good fit for product inspection and feature demos |
| Experience | One first-class, navigable 3D template | Art quality and reliability before template quantity |
| 3D renderer | Three.js via React Three Fiber, WebGL 2 baseline | Flexible, widely used ecosystem |
| Primary UI | Next.js + React + TypeScript | Shared application, admin and HTML fallback |
| Architecture | Modular monolith + PostgreSQL + object storage | Lower early operational cost than microservices |
| Scene customizations | Data-driven product placements, brand palette and media | Avoid uncontrolled arbitrary scene scripting |
| Navigation | Guided point-to-point mode + optional free walk | Supports both commerce convenience and immersion |
| Payments | Outbound trusted checkout links at MVP | Avoid building payment infrastructure |
| Asset authoring | Procedural geometry / licensed GLB to start | Blender optional, not a prerequisite |
| Complex animation | R3F/Three animation first | GSAP optional, introduced only if warranted |
| Reporting | Privacy-aware aggregate events and leads | Demonstrate business outcomes |
| Pricing | Paid pilot and managed service before self-serve SaaS | Test demand before platform breadth |
| User accounts | Business users only at MVP | Visitors browse without login |
| AI agents | Human-reviewed, milestone-sized tasks | Reduce unchecked code, product and security drift |

## 1.3 Clear exclusions at MVP

No multiplayer, no VR headset support, no AI shopping assistant, no unrestricted 3D editor, no internal checkout/payment vault, no marketplace for third-party scenes, no complex real-time user collaboration, no arbitrary visitor uploads, and no guarantee of improved sales. These are not needed to validate the product.

## 1.4 Success criteria

**Vertical slice:** New users enter a working 3D showroom, inspect one hero product, change a supported variant, access specifications, activate a commercial CTA, and use accessible fallback UI. **Commercial MVP:** Authorized business user updates products, assigns approved placement slots, previews and publishes a showroom, then views own analytics/lead events without developer assistance.

# 2. Business Problem, Audience and Market Validation

## 2.1 Customer jobs-to-be-done

1. **Launch a product:** Present a distinctive product story and allow interactive examination.
2. **Generate qualified interest:** Enable direct quote requests, demonstration bookings and store referrals.
3. **Update a campaign:** Change products, prices-as-displayed, content and branding without a code release.
4. **Prove campaign value:** Observe visit, interaction and CTA metrics within privacy constraints.
5. **Distribute everywhere:** Share a stable public link compatible with desktops, phones and conventional browsers.

## 2.2 Buyer and user personas

| Persona | Need | Friction to remove | Success signal |
|---|---|---|---|
| Brand marketer (buyer) | Memorable campaign and measurable leads | Expensive bespoke web 3D | Launch on schedule; lead/CTA outcomes |
| E-commerce manager (buyer/user) | Accurate catalog and outbound store flow | Stale duplicates of product data | Fast updates and correct product links |
| Creative agency (channel) | Repeatable branded deliverables | Each client requires a rebuild | Reuse templates without visual compromise |
| Visitor (desktop) | Enjoyable discovery and detailed inspection | Confusing movement / slow loading | Finds product and acts within a few minutes |
| Visitor (mobile) | Smooth browsing on modest device | Battery, controls, graphics | Core journey and CTA remain available |
| Platform operator | Reliability and support | Unknown tenant issues and bad uploads | Auditable operational events and recovery |

## 2.3 Market alternatives and competition

Recognize established immersive retail solutions such as **Emperia**, **Obsess** and **ByondXR**. Their public offerings demonstrate that brands buy virtual-store, immersive-showroom and related engagement technology. They do not establish that RealmCanvas will be commercially viable. RealmCanvas's proposed wedge is a **focused product category, excellent visual quality, an editable standard template, and transparent productized service** rather than maximum enterprise feature coverage.

**Do not make claims** of market share, conversion uplift or competitor pricing without additional primary research.

## 2.4 Customer discovery plan

Conduct **10 interviews** with possible buyers before investing heavily in polished assets. Ask about prior immersive campaigns, current catalog and content workflow, budget authority, campaign objectives, existing tools, switching constraints, willingness to pay for a short pilot, and what success would be measured against. Capture exact evidence and objections. Separately validate technical product feasibility with one sample client catalog.

Proposed gate: At least **3 credible prospects** willing to discuss a scoped pilot, including at least **1** with budget authority. If interest is superficial, reposition toward agency-led promotional experiences or another vertical.

## 2.5 Pricing hypotheses and operating economics

| Offer | Unvalidated test price | Included scope |
|---|---|---|
| Guided paid pilot | USD 1,000-3,000 one-time | One template, bounded SKU count, limited changes |
| Managed hosted showroom | USD 99-299/month + setup | Hosting, limited updates, analytics and support |
| Agency / enterprise | Custom quotation | Multiple clients, integration and service commitments |

Test prices with real buyers; they are **not actual market quotes**. Track customer acquisition cost, labor per onboarding, outsourced art costs, hosting/CDN bandwidth, support requests, gross margin, retention and expansion revenue. Pricing must reflect asset production, which may dominate early costs.

## 2.6 Business KPI definitions

| KPI | Proposed formula / interpretation |
|---|---|
| Showroom entrance rate | `experience_enter / landing_page_view` (eligible, consent-compatible aggregate) |
| Product interaction rate | Sessions with `product_inspected` / eligible showroom sessions |
| CTA click-through rate | `cta_clicked / product_detail_opened` for scoped product/showroom |
| Lead submission rate | Valid successful leads / eligible showroom sessions |
| Median time to first interaction | Median elapsed time from experience ready to first valid product action |
| Showroom setup effort | Business+operator hours from assets accepted to publish-ready |
| Customer retention | Paid customers active at period end / at period start (cohort-based) |
| Gross margin | (Revenue minus directly attributable costs) / revenue |

Analytics must not imply sales attribution solely from clicks. Test causality later through controlled comparisons to conventional catalog experiences.

# 3. Product Scope and Functional Requirements

## 3.1 Release definitions

- **Prototype / POC (P0-a):** Single demo product and interactable pedestal, basic navigation, deterministic content.
- **Vertical slice (P0-b):** Polished Arrival Portal and Discovery Gallery, working product inspection, CTA, mobile/fallback and performance measurements.
- **Commercial MVP (P0-c):** Business auth, product management, template slots, published version, leads, basic analytics, tenant security and pilot operations.
- **Version 1 (P1):** More templates, richer customization, storefront integrations, advanced reporting, additional staff roles.
- **Later (P2):** General-purpose scene editor, white-label agency workspaces, shared live events and optional VR.

## 3.2 Functional requirements catalogue

Requirements use IDs to make them testable. **Priority P0** is required for pilot release, **P1** is a subsequent iteration, and **P2** is speculative.

| ID | Priority | Requirement | Acceptance summary |
|---|---|---|---|
| FR-001 | P0 | Public landing and enter experience | Users can enter, choose 2D mode, see sound/quality controls |
| FR-002 | P0 | 3D showroom renderer | Template loads with recoverable errors and stable layout |
| FR-003 | P0 | Navigation | Keyboard/mouse, touch and guided destination controls work |
| FR-004 | P0 | Camera and collision | No routine clipping through solid landmarks; recover action exists |
| FR-005 | P0 | Product focus interaction | Selecting a display focuses product and opens accessible details |
| FR-006 | P0 | Product rotation | User can rotate eligible models and reset orientation |
| FR-007 | P0 | Product variants | Selecting a defined variant updates model/material and label |
| FR-008 | P0 | Product details | Show approved description, images, specs and CTA |
| FR-009 | P0 | CTA action | Validate scheme/domain policy and route to configured destination |
| FR-010 | P0 | Lead submission | Validate fields, rate limit, store, confirm, log operational status |
| FR-011 | P0 | HTML product catalog | Core discovery and action possible without WebGL |
| FR-012 | P0 | Business authentication | Only authenticated business users reach admin functions |
| FR-013 | P0 | Tenant authorization | Server checks membership and role for every admin data action |
| FR-014 | P0 | Product CRUD | Create/edit/archive products with validated media references |
| FR-015 | P0 | Placement editor | Assign product to an allowed template slot; preview changes |
| FR-016 | P0 | Branding controls | Approved logo, accent colors, copy and brand metadata |
| FR-017 | P0 | Versioned publishing | Only validated draft revisions can become public versions |
| FR-018 | P0 | Asset handling | Authorized upload, type/size validation and CDN delivery |
| FR-019 | P0 | Analytics summary | Per-tenant events and conversion reports with privacy safeguards |
| FR-020 | P0 | Responsive settings | Quality, audio, reduced motion and reset controls persist |
| FR-021 | P0 | Operational observability | Structured errors, health checks and deployment diagnostics |
| FR-022 | P0 | Audit trail | Business edits, publishing and privileged events are auditable |
| FR-023 | P1 | Product side-by-side comparison | Show selected eligible specifications |
| FR-024 | P1 | Custom domains | Confirm ownership and provide TLS, routing and removal path |
| FR-025 | P1 | E-commerce integration | Safe catalog sync and outbound checkout handling |
| FR-026 | P1 | Additional templates | Template registry and regression-certified publishing |
| FR-027 | P1 | Agency workspace | Delegated management of multiple organizations |
| FR-028 | P2 | Scene editor | Visual custom-placement authoring within secure constraints |
| FR-029 | P2 | Social / shared experiences | Moderated opt-in live sessions |

## 3.3 Use case: browse and inspect a product

**Actor:** Visitor. **Preconditions:** Showroom is published; product is active; model asset is available or fallback image exists.

1. Visitor opens public showroom page.
2. Landing content loads without requiring the 3D bundle.
3. Visitor chooses *Enter Experience* or *Browse Catalog*.
4. In 3D mode, visitor moves to or selects an approved pedestal.
5. The product is highlighted and an HTML info panel appears.
6. Visitor rotates the model, chooses an available finish and reads details.
7. Visitor chooses CTA. The application opens the approved destination or a validated lead form.
8. A permitted aggregate event is emitted; browsing remains possible.

**Alternates:** WebGL unsupported -> HTML gallery; GLB fails -> poster image with complete text/CTA; reduced motion -> slower or instant camera transitions; network drops -> error and retry; no variants -> hide variant selector; invalid checkout URL -> do not render clickable CTA, show benign unavailable state.

## 3.4 Use case: publish a business showroom

**Actor:** Owner or Editor with publish permission.

1. Sign in and select authorized organization.
2. Create or open draft showroom.
3. Set template, logo and approved colors.
4. Add products and assign them to known placement slots.
5. Preview current draft using the same read-only renderer as the public experience.
6. Request publish; server validates all references, required CTAs and asset readiness.
7. Server records immutable published revision and atomically changes active publication pointer.
8. CDN/public caches become eligible to refresh/invalidate.
9. Visitors see one coherent version, not partially updated content.

**Alternates:** Invalid asset -> publish blocked with explicit validation errors; role missing -> 403; concurrent edit -> 409 version conflict; publication failure -> retain previous stable public version.

## 3.5 User roles and permissions

| Action | Visitor | Analyst | Editor | Owner | Operator |
|---|---:|---:|---:|---:|---:|
| View published showroom | Yes | Yes | Yes | Yes | Yes |
| View organization analytics | No | Yes | Yes | Yes | Support-only, audited |
| Manage product content | No | No | Yes | Yes | Support-only, audited |
| Edit draft showroom | No | No | Yes | Yes | Support-only, audited |
| Publish showroom | No | No | Configurable | Yes | Support-only, audited |
| Manage membership/billing | No | No | No | Yes | Dedicated privileged procedures |

Authorization must live in the backend. Client-side navigation hiding is convenience, not security.

# 4. Flagship 3D World and Detailed Art Bible

![Celestial Tech Pavilion navigation](realmcanvas_assets/worldmap.png)

## 4.1 Experience identity

**World:** Celestial Tech Pavilion. **Look:** luxurious future architecture, dark mineral surfaces, restrained cyan/iris luminescence, cloud-level vistas, thin metallic trims, luminous product pedestals, cinematic but legible typography. **Emotional arc:** awe -> exploration -> informed confidence -> clear action.

## 4.2 World zones and business purpose

| Zone | Composition | Interactions | Commercial purpose |
|---|---|---|---|
| 01 Arrival Portal | Circular entry terrace, massive concentric arch, hero product silhouette | Enter, choose path, map, highlighted featured product | Establish premium brand identity |
| 02 Discovery Gallery | Curved walkway with 4-8 approved pedestal slots | Focus, inspect, quick variant, save interest | Discover products |
| 03 Product Lab | Intimate spotlighted room, floating exploded-view rig | Detailed rotation, selected components, specs, demo media | Explain features and differences |
| 04 Conversion Lounge | Calm atrium, warm rim light, product recap wall | Request quote, book demo, outbound purchase, share | Convert exploration to inquiry or referral |

**Important:** Use the same world for all pilot clients and customize through validated data. Initially provide guided navigation between zones plus optional free walking on collision-safe paths. Do not build unrestricted flying or an infinite island network.

## 4.3 Color and material tokens

| Token | Hex | Usage |
|---|---|---|
| `--void` | `#080E1C` | Sky / background / deep corners |
| `--slate` | `#182C49` | Architecture / secondary surfaces |
| `--aether-cyan` | `#37DDEB` | Focus state / primary accent |
| `--iris` | `#8D6BEE` | Portal accents / secondary effects |
| `--pearl` | `#E7F0FF` | Body UI text and illuminated details |
| `--dawn-gold` | `#F5CA8A` | Product reveal / conversion warmth |

**Material language:** brushed aluminium, matte composite stone, tinted glass on selective surfaces, luminous etched lines, shallow reflection pools. Avoid fully transparent materials covering large surfaces or performance-heavy real-time reflections everywhere. **Typography:** expressive editorial display type, legible functional sans-serif; all commercial instructions and spec values use conventional HTML elements.

## 4.4 Navigation and camera specification

**Default desktop:** guided destination selection (click a signpost/pedestal to travel) with WASD free-walk toggle. **Mobile:** tap destination/point of interest with virtual movement controls as optional enhancement. **Accessibility:** fully usable HTML catalog with keyboard and screen-reader access; never require physics-driven movement to reach a CTA.

**Camera rig:** third-person or soft over-shoulder for exploring, then product-centric orbit camera for inspection. Limit pitch and camera speed; prevent collision with walls; include Reset View and Return to Entrance. Distances, FOV and clipping planes to be tuned via early usability tests and stored in camera presets.

## 4.5 Interaction grammar

- **Discoverable:** a target shows a subtle ring or controlled highlight in range.
- **Focused:** selection raises contrast and provides a clear accessible `Inspect product` action.
- **Actuated:** product rises slightly, camera eases toward it, detail panel appears.
- **Configured:** variant change updates appearance, label, selection state and available features.
- **Commercial:** quote/checkout action opens a standard HTML interaction and never destroys the 3D session.
- **Recoverable:** Escape/Back closes inspection, reset restores camera, errors fall back gracefully.

## 4.6 Animation storyboard

| Beat | Duration target | Visual / audio design | Skip and access requirements |
|---|---:|---|---|
| Landing page | Immediate UI | Strong static image, calm title, enter CTA | Readable before any canvas |
| Portal arrival | 4-7 s | Cloud drift, camera glide, light revealing hero object | User-initiated, skip action |
| First pedestal | 0.5-1.2 s | Ring highlight, gentle lift, controlled orbit camera | Reduced motion -> crossfade/instant focus |
| Variant selection | 0.4-0.9 s | Smooth material/texture crossfade, selection feedback | Text selection always immediate |
| Lab feature demo | 2-5 s | Short exploded-view sequence and annotations | Playback and skip controls |
| Zone transition | 1-3 s | Camera travel with soft vignette/transition | Reduced motion -> immediate destination |
| Conversion scene | 0.5-1 s | Warm lighting, neat product recap and CTA | No animation gate for action |

**Ambient effects:** very low-amplitude procedural movement, limited particles, variable-quality lighting; all animation frame delta-driven. Audio optional and user-enabled; no auto-start audible playback before appropriate interaction.

## 4.7 UI/UX screens and states

**Screens:** Marketing homepage, entry panel, 3D showroom and HUD, product-detail drawer, product variant panel, guided map, HTML catalog, quote/contact form, onboarding, organization switcher, Studio overview, products table/editor, placement editor, showroom preview, publish confirmation, analytics dashboard and basic account settings.

**Every screen state:** loading, empty, success, validation error, permission denied, connection interruption, recoverable failure and unsupported capability. Write accessible focus management rules for overlays and drawers; no traps within the WebGL canvas.

# 5. Quality Attributes and Nonfunctional Requirements

## 5.1 Nonfunctional requirement catalogue

| ID | Attribute | Proposed criterion |
|---|---|---|
| NFR-001 | Availability | Aim >=99.5% public showroom availability during pilot; measure before formal SLA |
| NFR-002 | LCP | <=2.5 seconds at p75 where practical for HTML landing and fallback (Core Web Vitals good threshold) |
| NFR-003 | INP | <=200 ms at p75 for responsive interactions |
| NFR-004 | CLS | <=0.1 at p75 |
| NFR-005 | 3D smoothness | Aim 60 FPS on defined desktop profile; 30+ FPS on defined mid-range mobile profile |
| NFR-006 | 3D readiness | Initial interactive zone within 8s on agreed reference network/device (planning target) |
| NFR-007 | First-scene assets | Initial compressed 3D asset package <=4 MB (planning target, excludes application code) |
| NFR-008 | Responsive | 320 CSS px and above; test selected tablet/mobile viewports |
| NFR-009 | Reduced motion | Honor OS preference and offer explicit no/low-motion mode |
| NFR-010 | No-WebGL | Product information and primary CTA usable in HTML alternative |
| NFR-011 | Observability | Capture structured server errors, deployment/build metadata and session-safe client failures |
| NFR-012 | Tenancy | Negative tests prove no cross-tenant reads, writes or asset authorization |
| NFR-013 | Data protection | TLS, safe secrets, access logging, limited event/lead retention, backup tests |
| NFR-014 | Accessibility | Use WCAG 2.2 AA as design and audit target, with documented exceptions and remediations |
| NFR-015 | Maintainability | Modular domain boundaries, lint/typecheck/test pipeline, doc updates per decision |
| NFR-016 | Localization-ready | All user-facing text extracted for future localization; English MVP |
| NFR-017 | Compatibility | Latest stable Chrome, Firefox, Safari, iOS Safari, Android Chrome on reference devices |

**Note:** These are specifications, not verified performance results or contractual guarantees. Establish actual baselines with lab and field instrumentation, and track improvements over pilot releases.

## 5.2 Quality tiers and degradation

| Tier | Render scale | Effects | Geometry | Expected behavior |
|---|---|---|---|---|
| Low | DPR ~0.75-1.0 | No SSAO/SSR, minimal bloom | Low LOD, mostly baked light | Smooth simple exploration and working CTA |
| Medium | DPR ~1.0-1.5 | Limited selective effects | Balanced LOD | Default on average device |
| High | DPR ~1.5-2.0 capped | Controlled post-processing | Higher LOD | Better fidelity on stronger GPU |
| Fallback | No 3D | HTML images and video | Not applicable | Complete information/CTA flow |

Adapt quality from sustained frame time using hysteresis to prevent rapid oscillation. Never infer device performance solely from user-agent strings. Track frame time, loading time, asset errors and context-loss recovery without collecting unnecessary personal data.

## 5.3 Art and asset budgets

Use instancing for repeated décor, shared material libraries, baked lighting when feasible, texture atlases where appropriate, LOD for distant architecture and KTX2 textures / glTF mesh compression where supported. Set per-zone and per-product budgets during vertical-slice profiling; avoid inventing universal triangle or draw-call targets before reference hardware testing.

## 5.4 SEO and discoverability

Public showrooms need crawlable HTML titles, brand/product descriptions, canonical URLs, social preview images and sitemap rules. Marketing pages and the HTML catalog should have server-rendered content where possible. The full 3D renderer remains client-only and must not be required for core indexing.

# 6. Architecture and Technical Decisions

## 6.1 System context

RealmCanvas uses a single Next.js application for marketing, Studio and public showroom pages. The scene is rendered client-side by React Three Fiber using a **validated published scene manifest**. A modular application backend exposes public read APIs and protected business APIs. PostgreSQL stores business, product, content and lead records; object storage/CDN serves uploaded media and GLB files. An asynchronous worker is appropriate for asset processing when volume justifies it. An external auth provider/library manages business sessions.

![RealmCanvas modular architecture](realmcanvas_assets/architecture.png)

## 6.2 Module boundaries

1. **Identity & Organization:** memberships, scoped sessions, roles and invitations.
2. **Catalog:** products, attributes, variants, availability labels, links and media associations.
3. **Showrooms:** templates, drafts, placements, theme settings, immutable publication manifests.
4. **Experience Engine:** client-side loader, scene graph, camera, navigation, interaction dispatcher, accessible overlays and fallback.
5. **Leads & Conversion:** forms, validation, outbound CTAs, webhook/email hand-off (when configured).
6. **Analytics:** first-party consent-aware event collection, deduplication, aggregation and reporting.
7. **Asset Pipeline:** authorized uploads, validation/quarantine, optimization status, CDN URLs and disposal.
8. **Operations:** structured logging, health checks, security event audit, backups, operational alerts.

**Dependency rule:** Browser experience must never query arbitrary administrative tables or hold elevated credentials. It receives a minimal, read-only, published manifest containing approved public fields only.

## 6.3 Architecture decision records (ADRs)

- **ADR-001 Modular monolith:** Keep domain modules separated in one deployable backend initially. Revisit service extraction only when scaling or team boundaries demand it.
- **ADR-002 Scene manifest:** Separate business configuration from scene code; publish an immutable, schema-validated snapshot.
- **ADR-003 Safe interactions:** Registry of supported interaction types, no remote executable scripts or dynamically evaluated user code.
- **ADR-004 WebGL 2 baseline:** Optimize a stable widely-supported renderer before adopting advanced WebGPU-only features.
- **ADR-005 Bounded template:** Approved product sockets and art-directed layouts first; broad scene editing deferred.
- **ADR-006 HTML fallback:** All product information and conversion actions available without canvas interaction.
- **ADR-007 Third-party checkout:** Do not store card data or act as payment processor in MVP.
- **ADR-008 Optional art tools:** Blender and GSAP are never required by architecture; use only where value is demonstrated.

## 6.4 Proposed repo structure

```text
realmcanvas/
  AGENTS.md                     # Antigravity agent constraints
  README.md
  .env.example
  package.json
  package-lock.json             # or pnpm-lock.yaml (choose ONE manager)
  .github/workflows/ci.yml
  docs/
    REALMCANVAS_MASTER_SPEC.md
    ADR/
    API.md
    RUNBOOK.md
    TEST_MATRIX.md
    ART_BIBLE.md
  src/
    app/
      (marketing)/page.tsx
      (studio)/studio/
      showroom/[slug]/page.tsx
      api/public/
      api/admin/
    components/ui/
    experience/
      canvas/ExperienceCanvas.tsx
      camera/CameraRig.tsx
      controls/NavigationController.tsx
      interactions/InteractionRegistry.ts
      templates/celestial-pavilion/
      materials/
      effects/
      quality/QualityManager.ts
    modules/
      auth/
      organizations/
      products/
      showrooms/
      publications/
      assets/
      leads/
      analytics/
      audit/
    server/
      db/
      services/
      security/
      jobs/
    lib/
    config/
    schemas/
    stores/
    styles/
  public/
    images/
    models/
    textures/
    audio/
  prisma/                       # Only if Prisma selected
    schema.prisma
    migrations/
  tests/
    unit/
    integration/
    e2e/
    performance/
  scripts/
    validate-assets/
    seed-demo/
```

Choose package manager and database adapter once and document the decision. Do not install competing libraries for the same job without rationale.

## 6.5 Technology table with adoption triggers

| Layer | MVP choice | Alternative / trigger |
|---|---|---|
| Web and admin | Next.js + TypeScript | React/Vite if SSR not useful, decision before scaffold |
| Rendering | Three.js + React Three Fiber | Pure Three.js for unusual render pipeline after evidence |
| 3D helpers | Drei, selectively | Write small utilities when helper overhead not justified |
| Application state | Zustand for client UX; server domain services for truth | Other store if needed, never mix business authority into browser |
| Animation | R3F frame callbacks and timeline functions | GSAP for complex synchronized cinematic sequences |
| Physics | Start with simple raycast/navigation | Rapier only if player collisions physically require it |
| Asset creation | Procedural primitives / licensed GLB | Blender for custom modeling and baked maps |
| Database | PostgreSQL + typed ORM | Prisma or Drizzle; pin one after setup |
| Auth | Established provider/library | Avoid homegrown password handling |
| Uploads | Private staging + object storage/CDN | Worker-based optimization after upload workload grows |
| Tests | Vitest + Playwright | Add GPU screenshot gates for deterministic scene shots |
| Telemetry | Privacy-aware app/server monitoring | Additional analytics tool if contractual needs emerge |

## 6.6 Key runtime sequence

```text
Visitor -> public showroom route
  -> server returns public metadata + HTML fallback
  -> browser fetches published manifest (safe, cacheable)
  -> user opts into 3D
  -> ExperienceCanvas checks capabilities
  -> AssetManager loads priority environment + first product
  -> InteractionSystem binds manifest-defined product slots
  -> visitor inspects and triggers CTA / lead
  -> approved event -> analytics collector (subject to consent policy)

Owner -> Studio -> editable draft
  -> verify membership and authorization on server
  -> save validated product/placement/theme changes
  -> preview draft (authenticated, read-only simulation)
  -> publish request
  -> validate dependencies and optimistic revision
  -> transaction: write immutable publication, update active pointer
  -> public manifest fetch resolves active publication
```

# 7. Core State Machines and 3D Rendering Design

## 7.1 Showroom publication states

`DRAFT -> IN_REVIEW (optional) -> PUBLISHED -> ARCHIVED`. A new draft revision can be produced from the published snapshot without altering the live version. An unsuccessful publish leaves the previous published snapshot live. Publishing must use optimistic concurrency to prevent losing the changes of another editor.

## 7.2 Asset states

`REQUESTED -> UPLOADED -> SCANNING -> PROCESSING -> READY` or `REJECTED`. Only `READY` assets with permitted ownership and type can be linked into a public manifest. Rejection must expose a safe user-facing reason. Orphaned staged uploads are eventually deleted by retention policy.

## 7.3 Visitor experience states

`LANDING -> CAPABILITY_CHECK -> LOADING -> EXPLORING -> INSPECTING_PRODUCT -> (EXPLORING | CTA_ACTION)`. Any graphics-related state can transition to `HTML_FALLBACK`. `RECOVERABLE_ERROR` offers Retry and Continue in 2D.

## 7.4 Experience engine contracts

```ts
type InteractionType =
  | 'inspect_product'
  | 'focus_location'
  | 'play_feature_demo'
  | 'open_cta';

type QualityTier = 'low' | 'medium' | 'high' | 'fallback';

type SlotKey =
  | 'featured-hero'
  | 'gallery-01' | 'gallery-02' | 'gallery-03'
  | 'gallery-04' | 'lab-hero';

interface PublicPlacement {
  slotKey: SlotKey;
  productId: string;
  interaction: InteractionType;
  displayOptions: {
    defaultVariantId?: string;
    scale?: number; // constrained server-side
    label?: string;
  };
}

interface PublicSceneManifest {
  schemaVersion: 1;
  publicationId: string;
  templateId: 'celestial-tech-pavilion-v1';
  branding: {
    displayName: string;
    accentColor: string;
    logoUrl?: string;
  };
  placements: PublicPlacement[];
  products: PublicProduct[]; // safe public projection only
}
```

`PublicProduct` is separately defined by a runtime schema (id, public slug, title, summary, visible specification list, current media, supported variants and approved CTAs). **Prices shown are informational unless backed by authoritative commerce integration.** Do not accept arbitrary shaders, external script tags, unrestricted coordinates, CSS injections or unsafe links from the manifest.

## 7.5 Rendering system ownership

- `TemplateRegistry`: fixed world geometry, placement slot definitions, preview thumbnails, supported interactions.
- `AssetManager`: priority loading, caching, streaming/decompression, load failures, cleanup.
- `CameraRig`: guided poses, free navigation transitions, product orbit view, motion preferences.
- `NavigationController`: keyboard, touch and accessible destination selection.
- `InteractionSystem`: raycast/proximity targeting mapped to typed action registry.
- `ProductPresenter`: model/fallback image, variants, spec panel and selected presentation.
- `QualityManager`: selects and adapts quality tier, caps DPR, limits effects.
- `AudioManager`: opt-in ambient audio, muted by default until appropriate user action.
- `TelemetryBridge`: emits whitelist-only event types; never exports raw device fingerprints.

## 7.6 Preventing renderer performance pitfalls

Use shared geometries/materials, `InstancedMesh` for repeated elements, static scene subtrees, lazy GLB loading, texture compression, object pooling where appropriate and bounded post-processing. Do not call high-frequency React state setters in a render frame loop; mutate frame-local transforms safely. Do not spawn full scene copies during a transition. Avoid uncontrolled shadows on hundreds of meshes. Monitor GPU memory, draw calls, total texture load, p95 frame time and device-dependent fallback rates.

# 8. Data Design and Relational Specification

## 8.1 Entity relationship overview

```text
Organization 1--N Membership N--1 User
Organization 1--N Showroom 1--N ShowroomRevision
Showroom 1--N Publication (immutable snapshots)
Organization 1--N Product 1--N ProductVariant
Organization 1--N Asset
ShowroomRevision 1--N Placement N--1 Product
Organization 1--N Lead N--0/1 Product
Organization 1--N AnalyticsEvent
Organization 1--N AuditLog
```

## 8.2 Database schema (implementation-oriented)

| Table | Keys / fields | Important constraints and indexes |
|---|---|---|
| `organizations` | `id UUID PK`, `slug`, `name`, `created_at` | `UNIQUE(slug)` |
| `users` | `id UUID PK`, `auth_subject`, `email`, `created_at` | `UNIQUE(auth_subject)`, email normalization policy |
| `memberships` | `organization_id FK`, `user_id FK`, `role`, `status` | `UNIQUE(organization_id,user_id)`; role enum |
| `showrooms` | `id`, `organization_id`, `slug`, `title`, `template_id`, `active_publication_id?`, `created_at` | `UNIQUE(organization_id,slug)`; org index; avoid globally ambiguous public slugs |
| `showroom_revisions` | `id`, `showroom_id`, `revision_number`, `draft_config JSONB`, `edited_by`, `updated_at` | `UNIQUE(showroom_id,revision_number)`; schema validation |
| `publications` | `id`, `showroom_id`, `revision_id`, `manifest JSONB`, `published_by`, `published_at` | Immutable; indexed by showroom and published time |
| `products` | `id`, `organization_id`, `slug`, `name`, `summary`, `status`, `cta_url`, `updated_at` | `UNIQUE(organization_id,slug)`; status enum; org FK |
| `product_variants` | `id`, `product_id`, `label`, `attributes JSONB`, `model_asset_id?`, `display_order` | FK checks; stable order |
| `assets` | `id`, `organization_id`, `object_key`, `content_type`, `bytes`, `state`, `checksum`, `created_at` | Unique object keys, MIME allowlist, ownership and state indexes |
| `placements` | `id`, `showroom_revision_id`, `slot_key`, `product_id`, `config JSONB` | `UNIQUE(showroom_revision_id,slot_key)`; cross-org checks in domain layer |
| `leads` | `id`, `organization_id`, `showroom_id`, `product_id?`, `encrypted_contact JSONB`, `consent`, `status`, `created_at` | Organization/time indexes, defined retention, minimal PII |
| `analytics_events` | `id`, `organization_id`, `showroom_id`, `publication_id`, `session_token_hash?`, `event_type`, `event_data JSONB`, `recorded_at` | TTL/retention policy; indexes for org/showroom/day/event |
| `audit_logs` | `id`, `organization_id?`, `actor_id?`, `action`, `entity`, `entity_id`, `created_at`, `metadata JSONB` | Append-oriented; privileged access restrictions |

## 8.3 Multi-tenancy invariants

1. Any tenant-owned product, asset, placement, lead or analytics event belongs to exactly one organization.
2. Every protected query is constrained by an organization authorization check **performed on the server**.
3. Placement validation confirms the product and revision belong to the same organization.
4. Public manifests contain only published, explicitly whitelisted fields; internal IDs should not be used to authorize access.
5. Organization membership is checked for every write and admin read, including uploads and analytics.
6. Consider PostgreSQL Row Level Security as defense-in-depth only after designing a tested DB access identity pattern; it is not a substitute for explicit authorization.
7. Deletion and data-export flows must respect foreign keys and retention policies.

## 8.4 Database transactional requirements

Publishing and revocation must be atomic. Set a read-only publication snapshot and update `active_publication_id` in one transaction with a row/revision conflict check. Leads should use an idempotency strategy (request token or duplicate-window policy) to avoid repeated creation from double-clicks. High-volume analytics should be batchable and isolated from critical request latency; failed noncritical analytics must not break the checkout CTA or 3D experience.

## 8.5 Data lifecycle

Define business-level deletion, asset cleanup, lead retention, analytics aggregation windows, log retention and backup cadence during pilot agreements. **Do not invent regulatory compliance claims**; seek appropriate advice for applicable privacy and consumer-protection laws, especially when working with clients or visitors in different jurisdictions.

# 9. API Design and Contract Examples

## 9.1 API conventions

Prefix APIs `/api/v1`. Public reads use sanitized published views. Admin writes require authenticated membership and role checks. Validate payloads with runtime schemas. Use a consistent error structure, correlation ID, sensible status codes, explicit pagination and rate limiting. Prefer cursor pagination for high-volume tables. Date times are ISO 8601 UTC. Avoid secrets and internal storage paths in public responses.

```json
{
  "error": {
    "code": "REVISION_CONFLICT",
    "message": "The showroom draft has changed. Refresh and retry.",
    "requestId": "req_example_001",
    "details": []
  }
}
```

## 9.2 Endpoint catalogue

| Method | Endpoint | Access | Contract summary |
|---|---|---|---|
| GET | `/api/v1/public/showrooms/{orgSlug}/{showroomSlug}` | Public | Published manifest and optional ETag |
| GET | `/api/v1/public/showrooms/{...}/products` | Public | Published product projection |
| POST | `/api/v1/public/leads` | Public, rate-limited | Validate contact, product reference and consent |
| POST | `/api/v1/public/events` | Public, privacy-limited | Allowed analytics events with bounded properties |
| GET | `/api/v1/admin/organizations/current` | Authenticated | Authorized org metadata |
| GET/POST | `/api/v1/admin/products` | Editor+ | Paginated list / create product |
| GET/PATCH/DELETE | `/api/v1/admin/products/{id}` | Editor+ | Read/update/archive scoped product |
| GET/POST | `/api/v1/admin/showrooms` | Editor+ | List/create showroom |
| GET/PATCH | `/api/v1/admin/showrooms/{id}/draft` | Editor+ | Draft edit with revision token |
| POST | `/api/v1/admin/showrooms/{id}/preview` | Editor+ | Validated preview token/manifest |
| POST | `/api/v1/admin/showrooms/{id}/publish` | Owner or permitted Editor | Publish current validated revision |
| POST | `/api/v1/admin/assets/upload-request` | Editor+ | Authorized short-lived upload instructions |
| GET | `/api/v1/admin/analytics/summary` | Analyst+ | Date-scoped aggregate metrics |
| GET | `/api/v1/admin/leads` | Analyst+ or restricted role | Tenant-scoped masked lead listing |

Do not expose a public API that accepts arbitrary SQL filters, arbitrary asset URLs to fetch server-side, or scripts to inject into the canvas.

## 9.3 Public manifest example

```json
{
  "schemaVersion": 1,
  "publicationId": "pub_01_example",
  "templateId": "celestial-tech-pavilion-v1",
  "branding": {
    "displayName": "Example Audio",
    "accentColor": "#37DDEB",
    "logoUrl": "/media/example-audio-logo.svg"
  },
  "products": [
    {
      "id": "prod_01_example",
      "slug": "aurora-headphones",
      "title": "Aurora Headphones",
      "summary": "Demo product for the showroom prototype.",
      "specifications": [
        { "label": "Connectivity", "value": "Wireless" }
      ],
      "variants": [
        { "id": "var_black", "label": "Midnight" },
        { "id": "var_white", "label": "Pearl" }
      ],
      "cta": { "label": "View product", "url": "https://example.com/products/aurora" }
    }
  ],
  "placements": [
    {
      "slotKey": "gallery-01",
      "productId": "prod_01_example",
      "interaction": "inspect_product",
      "displayOptions": { "defaultVariantId": "var_black", "scale": 1 }
    }
  ]
}
```

All records above are **illustrative fixtures**, not real commercial product claims. `example.com` is a placeholder; production uses verified destinations. Template slot keys and manifest fields are versioned and server-validated. Sensitive administrative data must never appear in this response.

## 9.4 Lead submission example

```json
{
  "showroomPublicId": "showroom_example",
  "productPublicId": "prod_01_example",
  "fullName": "Sample Visitor",
  "email": "sample@example.com",
  "message": "Please send availability and pricing information.",
  "consent": { "contactRequested": true, "privacyNoticeVersion": "v1" },
  "idempotencyKey": "client-generated-random-token"
}
```

Server revalidates target product and active publication, normalizes text, applies bot/abuse controls, and returns a success receipt with no echo of excessive PII. Failure paths distinguish invalid form (400/422), rate limit (429), authorization (403, admin endpoints), conflict (409), and service errors (5xx).

## 9.5 Analytics event allowlist

`landing_viewed`, `experience_entered`, `scene_ready`, `zone_visited`, `product_inspected`, `variant_selected`, `cta_clicked`, `lead_form_opened`, `lead_submitted`, `fallback_entered`, `graphics_error`. Each event carries sanitized business context (showroom/publication/product identifiers where relevant), source application version and timestamp; avoid typed search terms, email addresses, device fingerprints and unbounded custom properties.

## 9.6 API definition of done

For each endpoint implement schema validation, authorization (where required), typed service call, predictable errors, audit where necessary, integration tests including cross-tenant negative cases, and API documentation updated in the same change.

# 10. Security, Privacy, Accessibility and Legal Controls

## 10.1 Threat model: prioritized cases

| Threat | Impact | Prevention / detective control | Test |
|---|---|---|---|
| Cross-tenant IDOR | Unauthorized customer data access | Every service operation takes authorized tenant context; deny unknown IDs | Tenant A cannot GET/PATCH tenant B product |
| Public draft exposure | Leaked unreleased products | Public endpoints only use active published snapshot | Draft never appears on public URL |
| Upload-based malware/abuse | Client compromise, denial of service | Signed uploads, size and MIME checks, scan/quarantine, asset processing | Bad MIME, oversize, malformed glTF rejected |
| Unsafe outbound CTA | Phishing or script execution | HTTPS-only allowlist/policy; reject `javascript:` and internal schemes | Malicious URL never becomes link |
| Injection / HTML XSS | Account or visitor compromise | Schema validation, safe rendering, no arbitrary HTML/scripts in config | Payload displayed safely or rejected |
| CSRF/session theft | Unauthorized admin changes | Secure cookies, CSRF defense as appropriate to auth model, session rotation | Cross-origin write blocked |
| Brute force or bot traffic | Cost growth, spam | Rate limits, spam detection, anomaly alarms | 429 at bounded rate |
| Data leaks in analytics | Privacy violation | Event allowlist, consent controls, minimal retention, PII redaction | Email never sent through analytics |
| Dependency compromise | Supply chain harm | Lockfile, trusted packages, audit process, review updates | CI dependency checks |
| Stale asset cache | Wrong product / version | Immutable hashed assets and publication IDs, versioned cache keys | Switch publication without mixed scene states |

Track the **OWASP Top 10:2025** as a baseline awareness model, particularly Broken Access Control (A01), Security Misconfiguration (A02), Supply Chain Failures (A03), Injection (A05), Authentication Failures (A07), and Mishandling of Exceptional Conditions (A10).

## 10.2 Secrets, permissions and AI agent safeguards

Store secrets only in a local `.env.local` ignored by Git and production secret management; commit a scrubbed `.env.example`. Agents must never be given production credentials or broad database privileges. Prefer least-privilege local/test resources. Human approval required before destructive database migrations, external account operations, credential changes, public deployment or deleting user files. Review any shell command that changes outside the project directory.

## 10.3 Privacy engineering

Set a documented basis/consent design appropriate to operating jurisdictions. Clearly separate necessary operational diagnostics, aggregate business analytics and personally identifiable lead records. Only collect what is needed, publish retention periods, restrict lead visibility, provide deletion/export pathways where required and avoid unnecessary cross-service transfer. Do not promise GDPR, Sri Lankan PDPA or any other legal compliance without a proper legal/operational review.

## 10.4 Accessibility checklist

- Semantic HTML for menu, catalog, forms, product specs and actions.
- Keyboard traversal for dialogs, menus, interactive cards and map destinations.
- Escape closes modal/inspection and returns focus to invoking control.
- Never require precise dragging or real-time motion to buy/contact.
- Respect operating-system reduced-motion and app preference.
- Provide text descriptions for 3D objects, visual status and feature demonstration.
- Avoid color-only states; maintain accessible contrast.
- Provide subtitles or equivalent text for essential media/audio.
- Treat touch target sizing and zoom as design requirements.
- Test screen-reader path in HTML fallback.

## 10.5 Commercial and IP safeguards

Before public brand use: check name and trademark (RealmCanvas is provisional), confirm domain availability, verify licenses for 3D models, fonts, textures, sound and product images, document ownership of code and designs, specify client-content rights in pilot agreements, and document privacy notice and terms. Do not use recognisable trademarks/products in published demonstrations without authorization.

# 11. Visual Asset and Content Production Pipeline

## 11.1 Required assets for the first slice

| Asset | Minimum first-slice scope | Creation path |
|---|---|---|
| Entry environment | Portal, floor, rails, distant clouds, lit hero platform | Procedural meshes and simple GLB pieces |
| Gallery | Walkway, four pedestals, frame lights, signage | Reusable parametric components |
| Hero product | One legally reusable headphone/speaker-like model | Licensed or custom GLB; image fallback |
| Variants | Two material/finish configurations | Shader/material properties |
| UI | Brand identity, inspect panel, CTA, controls, settings | Semantic React / CSS |
| Environment map | Simple studio/environment lighting | Permissible environment texture or controlled lighting |
| Audio | Optional low-key ambience and interaction chime | Licensed/owned, user opt-in |
| Fallback | Poster images and product catalog | Derived optimized static media |

## 11.2 Workflow

1. Prototype spaces with low-cost primitive geometry and representative camera paths.
2. Validate scale, interaction reach, readable text, travel distances and mobile performance.
3. Replace only hero landmarks and product assets where custom geometry measurably improves results.
4. Export GLB/glTF with consistent units, orientation, predictable hierarchy and named interaction anchors.
5. Validate model dimensions, materials, UVs, animation clips and triangle counts in a test viewer.
6. Optimize: deduplicate textures, resize overspecified maps, compress geometry when useful, generate LOD/impostor substitutes and KTX2 maps where supported.
7. Generate thumbnail and image fallback for each product.
8. Upload to staging, scan/process, verify decoding and approve for publication.
9. Measure GPU memory/draw calls and visual quality on low/medium/high profiles.
10. Maintain provenance: source, license, author, version, allowed usage and attribution requirement.

## 11.3 Blender and GSAP policy

**Blender:** Not mandatory. Use for complex architecture, bespoke hero products, UV work, rigs, light baking and cleanup as needs arise. **GSAP:** Not mandatory. Use only if multi-channel cinematic sequences are hard to maintain with Three.js/R3F animation primitives. A technology should be added with an ADR stating its actual benefit, cost and tests.

# 12. Local Developer Environment and Antigravity IDE Setup

## 12.1 Workstation prerequisites

- Windows 10/11 x64 (or supported Linux/macOS), recent Node.js **LTS**, Git, a consistent package manager, modern Chrome/Firefox/Safari equivalent for testing, editor/Antigravity IDE.
- PostgreSQL local instance or safe containerized development database.
- Optional Docker Desktop for reproducible local services; optional Blender for authoring custom models.
- Access to a nonproduction object-storage bucket when media upload work begins.
- Do not assume Antigravity installs project dependencies or configures the OS correctly without inspecting the actual machine.

**Antigravity official guidance:** Create a project bound to the local repository folder; use the Editor/Agent surface for planned changes and the browser/testing surface for verification. The IDE recognizes workspace instructions including `AGENTS.md`, `GEMINI.md`, and `.agents/rules/*.md`. Review plans and diffs before agent actions that are broad or destructive. The Antigravity Workflows documentation currently warns that legacy workflows are transitioning on **19 October 2026**; use durable repository rules and explicit task prompts rather than depending on that feature as the main automation interface.

## 12.2 Suggested initial commands (run manually and inspect results)

```bash
# 1) In a clean local parent folder:
npx create-next-app@latest realmcanvas --typescript --eslint --app --src-dir
cd realmcanvas

# 2) Open this folder as an Antigravity Project / workspace.
# 3) Commit the generated baseline before additional features:
git init
git add .
git commit -m "chore: initialize RealmCanvas application"

# 4) Then ask the agent to inspect compatibility and propose installs:
# three, @react-three/fiber, @react-three/drei, zustand, zod
# add database and testing libraries in a separate reviewed step.
```

The scaffolder flags above are suggestions; verify against the installed CLI because scaffold options evolve. Never blindly copy commands in a shell with an unknown current directory. Pin compatible package versions and commit the lockfile. React/R3F peer dependency compatibility must be checked before install.

## 12.3 Example environment variable contract

```ini
# .env.example (placeholders only - do not add real secrets)
DATABASE_URL=postgresql://user:password@localhost:5432/realmcanvas_dev
AUTH_SECRET=replace-with-local-secret
OBJECT_STORAGE_BUCKET=realmcanvas-dev
OBJECT_STORAGE_REGION=local-or-provider-region
OBJECT_STORAGE_ENDPOINT=
PUBLIC_BASE_URL=http://localhost:3000
ANALYTICS_ENABLED=false
```

Exact variable names depend on the chosen auth/storage libraries. Never hardcode tokens into client bundles; only variables explicitly prefixed for safe public exposure may reach the browser after review.

## 12.4 Recommended local verification commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm test -- --run
npm run build
# npx playwright test   (after Playwright configured)
```

These are examples: define the corresponding package scripts first. Record actual command output and failures in the agent's handoff. Never claim tests passed merely because the code looks plausible.

## 12.5 Antigravity rules: root AGENTS.md

Create this repository-level rule file and keep it small. Its contents are also delivered separately in the companion agent pack.

```md
# RealmCanvas Agent Rules

- Read `docs/REALMCANVAS_MASTER_SPEC.md` before architecture-changing edits.
- Work on exactly one approved milestone/task per agent request.
- Before editing, summarize objective, files to change, acceptance criteria and risks.
- Preserve modular monolith boundaries and public/admin separation.
- Treat published scene data as untrusted: validate schemas and whitelist interactions.
- Enforce server-side tenant membership and role checks on every admin data action.
- Never expose secrets, unpublished data, unsafe URLs or raw PII via public manifests.
- Keep HTML product/CTA fallback functional if WebGL is unavailable.
- Treat Blender, GSAP, Rapier and microservices as optional; do not add without rationale.
- Use TypeScript strict mode, small modules, runtime validation and explicit error paths.
- Tests and documentation must accompany behavior changes.
- Do not run destructive commands, deploy, change billing or touch production without approval.
- After each task, report changed files, test commands with observed results,
  remaining limitations, and the next smallest recommended task.
```

## 12.6 Recommended agent loop

**One small task per conversation or branch:** (1) clarify acceptance criteria from this spec, (2) agent produces a plan, (3) human reviews, (4) agent implements, (5) agent runs linters/tests/build, (6) browser visually verifies when relevant, (7) human inspects diff, (8) commit/tag milestone. Avoid asking the agent to generate the entire application in a single prompt.

The Antigravity IDE supports implementation plan artifacts and review. Prompt it to request review prior to changing the repository for work spanning multiple modules. Check the tool permission and artifact review policy in Settings; use restrictive approval defaults for commands affecting the file system or external systems.

## 12.7 Agent tasks: what to ask and what to reject

**Accept:** a plan with changed-file list, exact tests, intended architecture, constraints, rollback and clear end state.

**Reject:** unexplained new infrastructure, uncontrolled full-project rewrites, fake API results, hidden auth shortcuts, direct SQL from client, arbitrary scripts in scene config, unverified security claims, or fabricated successful tests.

# 13. Antigravity IDE Implementation Prompts (Copy/Paste)

## Prompt A: repo initialization audit

```text
You are acting as a senior full-stack engineer implementing RealmCanvas.
Read docs/REALMCANVAS_MASTER_SPEC.md and AGENTS.md before any change.
Do not write code yet. Inspect the existing repo and report:
(1) current framework and tool versions, (2) gaps against milestone P0-a,
(3) a proposed folder/module structure, (4) package compatibility risks,
(5) exact commands for lint, typecheck, test and production build,
(6) a small initial implementation plan with clear acceptance tests.
Ask for approval before making architectural or dependency changes.
Do not introduce Blender, GSAP, microservices or a database until needed.
```

## Prompt B: interactive first showroom

```text
Implement ONLY P0-a: a client-only React Three Fiber Celestial Pavilion
prototype with a sky/background, floor, landmark arch, 1 reusable product
pedestal, selectable product, and an HTML accessible inspection panel.
Use placeholder procedural geometry and a clearly labelled fictional product.
Ensure the product CTA is valid and safe; offer a usable non-3D fallback.
Do not implement auth, database, analytics or full Studio yet.
Acceptance: pointer selection works; keyboard path works; canvas error or
unsupported WebGL keeps catalog and CTA usable; lint/typecheck/build pass.
Before code edits, propose a file plan and tests for review. Afterwards,
show changed files, actual command output and a browser verification summary.
```

## Prompt C: responsive camera and controls

```text
Improve the current vertical slice only. Add guided point-to-point camera
positions, a controllable inspection orbit camera, keyboard navigation,
mobile-friendly destination controls, Reset View and reduced-motion support.
Avoid forced long camera animation and preserve native HTML interaction.
Measure frame time on a reference desktop and a mobile emulator or device;
report actual measurements rather than making up performance claims.
Include tests for focus restoration after closing the inspect panel.
```

## Prompt D: schemas and modular backend

```text
Review the master specification's organizations, products, showrooms,
revisions, publications, placements and assets. Propose a PostgreSQL schema,
required unique constraints, migrations and API input/output validation.
Do not create an unrestricted scene editor. Enforce tenant context at the
service boundary and separate safe published DTOs from admin models.
Prepare a migration plan and cross-tenant negative tests before writing.
Implement one domain module at a time only after plan approval.
```

## Prompt E: Studio management and publish

```text
Implement the next approved Studio milestone: authenticated product CRUD,
fixed template placement configuration and immutable versioned publishing.
Use validated schema configs and safe asset references. An Editor without
publish permission must not publish. A failed publish must leave the
previous public version intact. Demonstrate concurrent revision conflict
handling, public draft exclusion and tenant isolation in tests.
```

## Prompt F: release verification

```text
Act as a release engineer. Do not assume code is correct. Inspect actual
repo and run the documented checks: lint, typecheck, unit/integration,
Playwright E2E, production build, route authorization, accessibility audit,
and selected device/browser performance tests. Record pass/fail/blocked
with evidence. Never state a test passed if it was not executed. Produce
a risk-ranked issue list and propose the smallest fixes first. Do not deploy.
```

## Prompt G: architectural critique

```text
Review RealmCanvas as a senior software architect and security reviewer.
Compare implemented behavior against FR/NFR requirements and ADRs in the
master specification. Identify unnecessary dependencies, performance hotspots,
missing tenant guards, weak public DTO boundaries, unsafe asset paths,
privacy problems, and release blockers. Prioritize findings Critical/High/
Medium/Low. Do not modify the repository until the review is approved.
```

# 14. Development Roadmap and Milestone Gates

## 14.1 High-level timeline

**Planning estimate:** ~20-28 weeks part-time for a credible pilot-ready commercial MVP including art production and validation. Actual duration depends heavily on learning curve, asset complexity, the existing codebase and number of contributors.

| Phase | Indicative weeks | Required outputs | Exit gate |
|---|---|---|---|
| P0 Discovery | 1-2 | Interviews, product niche, scoped PRD, naming review | Buyer problem and testable pilot offer |
| P1 Design & spike | 3-4 | Art bible, storyboard, camera and renderer spike | Realistic quality/performance prototype |
| P2 Engine | 5-6 | Navigation, canvas, interaction registry, HTML fallback | Usable greybox scene |
| P3 Vertical slice | 7-9 | Polished Portal + Gallery, hero product demo | End-to-end visitor journey |
| P4 Conversion layer | 10-11 | Variants, detail panel, CTA, lead form | Validated action and confirmations |
| P5 Studio & backend | 12-15 | Auth, organizations, products, draft, placements, publish | Business can update and publish |
| P6 Analytics & operations | 16-17 | Event pipeline, metrics, audit, logs | Correct tenant-scoped reporting |
| P7 Hardening | 18-19 | Performance/accessibility/security regression | Release blockers addressed |
| P8 Pilot | 20-22 | 1-3 external pilot implementations | Customer feedback, observed outcomes |
| P9 Launch readiness | 23-24+ | Documentation, support, ops and deployment | Operationally supportable public product |

## 14.2 Detailed first 10 tasks

| Task | Build step | Exact completion evidence |
|---|---|---|
| T01 | Validate name, problem and buyer | Interview notes and decision log |
| T02 | Create art bible and first storyboard | Approved tokens, 4-zone concept, motion/reduced-motion choices |
| T03 | Scaffold code and CI | Clean Next.js app, lint/typecheck/build and initial commit |
| T04 | Add R3F with first scene | Canvas visible; graceful capability fallback |
| T05 | Add landmark and hero pedestal | Styled environment and inspectable fictional product |
| T06 | Add selection and accessible panel | Pointer + keyboard action; focus restored on close |
| T07 | Build guided navigation and camera | 2 destinations, reset behavior and mobile fallback |
| T08 | Implement product variant state | Two variants visible and correctly labelled |
| T09 | Add CTA and optional lead flow | Safe link or valid confirmed lead in test environment |
| T10 | Measure and improve vertical slice | Documented render timings/first assets and regression tests |

Each task should become a small branch/commit or reviewable diff. Do not defer all testing to the end.

## 14.3 Milestone exit checklists

**Vertical slice:** a visitor can enter on desktop/mobile, view the world, navigate, inspect a product, configure its finish, reach the CTA and continue in HTML fallback. The site handles WebGL load failure. At least one initial usability test is conducted.

**Commercial MVP:** org owners/editors can maintain content and assign fixed slots; publication is immutable and atomic; no cross-tenant leakage; leads and metrics are captured appropriately; the product is operable and documented; pilot customers can receive support.

**Public launch:** final naming, contracts, license inventory, billing policy (if charging), privacy notices, incident response, tested backups, deployment/rollback instructions and customer-facing support docs.

# 15. Test Plan and Traceability

## 15.1 Test categories

| Area | Positive case | Negative / recovery case |
|---|---|---|
| Public scene | Loads active manifest and product | Missing model -> poster and details |
| Navigation | Keyboard/mouse/touch work | Lost/stuck -> Reset View/return hub |
| Product inspection | Focus, rotate, variant, close | Unknown variant -> safe rejection |
| Publishing | Valid draft -> published snapshot | Missing asset, conflict -> existing public version preserved |
| Authorization | Owner edits own business | Tenant A cannot access B content |
| Upload | Valid GLB and image approved | Oversize/malformed/untrusted link rejected |
| Lead | Valid inquiry stored once | Spam, repeated request, bad email restricted |
| Analytics | Allowed event aggregated | PII or unknown event rejected/dropped |
| Offline/interrupted | Retry after temporary disruption | No blank page or stuck loading overlay |
| Accessibility | Keyboard + HTML catalog usable | Reduced motion disables forced camera movement |
| Rendering | Quality tiers operate on devices | Context loss switches to retry/fallback |
| Deployment | Migrates, serves, caches, monitors | Rollback to previous publication/app version |

## 15.2 Example test cases with IDs

- **TC-001 (FR-001/002):** First load: title, CTA and fallback catalog render before/independent of WebGL start.
- **TC-002 (FR-005/008):** Clicking gallery pedestal opens correct product; dialog heading, details and close control work.
- **TC-003 (FR-007):** Variant change updates selected state and model material; invalid variant has no effect and reports error.
- **TC-004 (FR-009):** Unsafe `javascript:` CTA is rejected by schema/service and never navigable.
- **TC-005 (FR-011/NFR-010):** Disabled WebGL still supports reading all published product details and CTA.
- **TC-006 (FR-013):** Tenant A member receives 404/403 for tenant B data through direct API request.
- **TC-007 (FR-017):** Invalid draft publish yields validation details and retains old publication ID.
- **TC-008 (FR-017):** Two editors saving same revision causes version conflict, not silent last-write-wins.
- **TC-009 (FR-018):** Uploading a misleading extension or oversized model fails and remains unpublished.
- **TC-010 (FR-019):** Unknown event, PII-like custom property and mismatched organization are rejected/stripped.
- **TC-011 (NFR-009):** Reduced-motion mode does not automatically fly camera through scene.
- **TC-012 (NFR-005):** Desktop/mobile scene frame time sampled on named reference devices; budgets compared to actual evidence.
- **TC-013 (FR-010):** Repeated lead request with same idempotency key yields one stored lead.
- **TC-014:** Restoring previous app build does not corrupt immutable published scene manifest schema.

## 15.3 Testing automation strategy

**Unit:** schemas, permissions, safe URL rules, manifest compiler, camera math helpers, analytics allowlist. **Integration:** database tenancy, publish transaction, lead deduplication, upload permissions. **E2E:** visitor happy path, HTML fallback, business product update and publish. **Visual:** deterministic camera snapshots for chosen viewport/quality tier. **Manual:** real-device performance, touch gestures, screen readers, motion comfort and first-time user study.

Run `lint`, `typecheck`, unit tests and production build in CI for each pull request. Gate release with integration/E2E and staged smoke tests. Record actual runs (date, version, device and pass/fail evidence). Beware that GPU screenshots can fluctuate across drivers; assert layout and interaction behavior independently of pixel-perfect shaders.

# 16. Deployment, Operations and Maintenance

## 16.1 Environment plan

- **Local:** per-developer test DB and fake product catalog.
- **Preview:** per-branch deploy or equivalent; safe seeded tenants and sample content only.
- **Staging:** production-like environment with upload processing and monitoring.
- **Production:** controlled configuration, TLS, backups and domain management.

Keep each environment's secrets separate. Apply migrations in a reviewed order. Prefer nonbreaking additive database changes that support rolling releases.

## 16.2 CI/CD stages

```text
Commit / pull request
  -> install from lockfile
  -> lint + formatting + typecheck
  -> unit/integration tests
  -> security/dependency review
  -> production build
  -> preview deployment
  -> Playwright + manual visual checks
  -> human approval
  -> production deployment
  -> health + functional smoke test
  -> monitor + rollback if needed
```

## 16.3 Production observability

Track API error rates and latency, publish failures, unauthorized access patterns, asset-processing queue failures, first-scene load errors, canvas fallback rate, client exceptions, lead delivery failures, DB resource utilization and CDN traffic/costs. Avoid logging raw contact submissions, auth tokens or other secrets. Define a minimum viable incident process: detect, triage, mitigate, communicate, root-cause and prevent recurrence.

## 16.4 Backup and recovery

Daily DB backups during pilots are a proposed baseline, with restore testing before customers rely on the system. Retention and recovery time objectives must be finalized with the hosting setup and any contracts. Keep immutable scene assets and published manifests recoverable by version. Test a rollback path for both code and active publication pointer.

# 17. Risk Register and Decision Gates

| Risk | Likelihood | Impact | Mitigation / owner |
|---|---|---|---|
| No paying audience | Medium-High | Critical | Interviews, paid pilots; product owner |
| Over-scoped 3D editor | High | High | Fixed slot templates; technical lead |
| Poor phone performance | High | High | Progressive assets, quality tiers, device matrix; graphics owner |
| Asset creation bottleneck | High | High | Procedural repeatables, licensed assets; art owner |
| Unsafe cross-tenant access | Medium | Critical | Server auth checks, integration tests; backend/security owner |
| Bad upload crashes renderer | Medium | High | Staging validation, fallback; platform owner |
| Low engagement-to-conversion | Medium | High | Explicit CTAs, pilot metrics, user studies; product owner |
| Missing accessibility | Medium | High | HTML equivalent + audit; frontend owner |
| Cloud costs increase | Medium | Medium | Per-tenant CDN monitoring, compression, quotas; ops owner |
| Name/domain conflicts | Medium | Medium | Trademark/domain clearance; business owner |
| Agent-induced regressions | Medium | High | Scoped plans, code review, branch and tests; engineering owner |

## 17.1 Go / No-Go checklist

**GO** when there is: validated initial buyer problem, one stable and visually strong 3D slice, measurable CTA flow, no known cross-tenant leak, understandable onboarding, fallback UI and operating cost visibility. **NO-GO** when: impressive graphics are the only product value, the published scene can execute arbitrary user code, access control is unverified, or the content publishing process is manually fragile.

# 18. Sprint Board and Definition of Ready / Done

## 18.1 Initial sprint backlog (ready-to-schedule tasks)

| ID | Task | Priority | Depends on | Acceptance |
|---|---|---|---|---|
| RC-001 | Create repository and build baseline | P0 | None | Typecheck, lint, build produce observed pass |
| RC-002 | Implement root shell and design tokens | P0 | RC-001 | Responsive branded landing layout |
| RC-003 | Add WebGL capability probe + fallback route | P0 | RC-001 | No-canvas catalog displays on unsupported browser |
| RC-004 | Implement procedural Portal greybox | P0 | RC-003 | Stable render with camera and floor |
| RC-005 | Add typed interaction registry | P0 | RC-004 | Click/focus inspect action is whitelisted |
| RC-006 | Add accessible product detail drawer | P0 | RC-005 | Keyboard, close, focus and reduced motion tested |
| RC-007 | Support hero model and image fallback | P0 | RC-006 | Broken model does not block CTA |
| RC-008 | Product variant demo | P0 | RC-007 | Two material states update correctly |
| RC-009 | Guided camera presets / navigation | P0 | RC-004 | Arrival and gallery reachable by click/keyboard |
| RC-010 | Performance and visual baseline | P0 | RC-004..009 | Reference device profiling logged |
| RC-011 | Database + tenant service scaffolding | P0 | RC-001 | Scoped read/write integration tests |
| RC-012 | Auth and role guards | P0 | RC-011 | Unauthorized writes blocked |
| RC-013 | Catalog CRUD and media association | P0 | RC-012 | Business owner edits product and previews |
| RC-014 | Draft revision + publish transaction | P0 | RC-013 | Immutable public publication, conflict tested |
| RC-015 | Fixed placement editor | P0 | RC-014 | Changes visible in preview then publication |
| RC-016 | Lead workflow | P0 | RC-011 | Valid inquiry + duplicate protection |
| RC-017 | Consent-aware analytics | P0 | RC-011 | Allowlisted event aggregate; no PII |
| RC-018 | Mobile/accessibility regression | P0 | RC-010..017 | Defined matrix completed |
| RC-019 | Pilot onboarding and support notes | P0 | RC-014..018 | External pilot can be set up repetitively |

## 18.2 Definition of Ready (for an agent task)

An individual task is ready when its objective is concrete; files and APIs likely touched are identified; relevant requirements are cited by ID; input fixtures exist; expected user-visible behavior is written; test commands can be stated; dependencies and security concerns are known; and the change is small enough to review in a single diff.

## 18.3 Definition of Done

Implementation matches acceptance, has appropriate tests, handles failures, preserves tenant isolation and HTML fallback, does not degrade measured performance without approval, passes lint/typecheck/build, updates relevant docs and has been reviewed in browser when visual. Actual test execution evidence must be recorded.

# 19. Open Questions and Assumption Log

The document provides a baseline **without pretending unresolved matters are settled**.

| ID | Decision required | Default until resolved | Decision point |
|---|---|---|---|
| OQ-01 | Product name legal clearance | Working name `RealmCanvas` | Before public launch |
| OQ-02 | First niche exact buyer | Electronics / premium tech | After interviews |
| OQ-03 | First production pilot client | Fictional demo dataset | Customer validation |
| OQ-04 | Business auth solution | Established supported auth provider/library | Backend design sprint |
| OQ-05 | ORM | Prisma or Drizzle, choose one | Before schema migration |
| OQ-06 | Hosting and CDN | Provider-agnostic architecture | Deployment phase |
| OQ-07 | Lead delivery mechanism | Secure admin listing at minimum | Pilot onboarding |
| OQ-08 | Free-walk vs guided default | Guided default, free-walk optional | Usability test |
| OQ-09 | Model creation tool | Procedural first | Visual fidelity assessment |
| OQ-10 | Animation library | Native R3F first | Finale/cinematic complexity |
| OQ-11 | Custom domain / billing | Defer to P1 | Paying customers request |
| OQ-12 | Privacy/retention periods | Specify with actual operating region and legal advice | Before pilot collection |
| OQ-13 | Exact performance/device budget | Proposed targets from section 5 | First profile run |
| OQ-14 | Revenue and conversion assumptions | Unvalidated hypotheses | Paid pilot measurements |

# 20. Glossary

| Term | Meaning |
|---|---|
| 3D engine | Reusable runtime for rendering scenes, camera and interactions |
| GLB / glTF | Portable formats for 3D model geometry, materials and animation |
| R3F | React Three Fiber, React renderer for Three.js |
| LOD | Level of detail, reducing distant geometry complexity |
| DPR | Device pixel ratio used to size canvas rendering |
| PBR | Physically based rendering / material workflows |
| Tenant | A distinct business organization with logically isolated data |
| Studio | Authenticated business dashboard for configuring showrooms |
| Template slot | Predefined legal placement anchor in a versioned 3D scene |
| Scene manifest | Validated public data describing branding, products and placements |
| Draft revision | Editable showroom state not exposed to public visitors |
| Publication | Immutable snapshot exposed to public visitors |
| CTA | Call to action, such as request quote or open official store |
| Vertical slice | Small production-quality, end-to-end portion of the experience |
| ADR | Architecture Decision Record with context, choice and consequences |
| HTML fallback | Complete accessible non-WebGL path for catalog and conversion |
| p75 / p95 | 75th / 95th percentile of measured observations |

# 21. How to Implement This Specification in Antigravity IDE

**Step 1: Prepare workspace.** Create a local `realmcanvas` folder/repo and open it as an Antigravity project. Place this Markdown document at `docs/REALMCANVAS_MASTER_SPEC.md`; place the companion `AGENTS.md` at the repository root. Verify the IDE's current project path and terminal working directory.

**Step 2: Start with a review request.** Copy **Prompt A** (Section 13) into the Antigravity agent. Ask it to inventory the environment and propose the first constrained plan **without writing code**. Review dependency compatibility, the implementation plan and file changes.

**Step 3: Approve only the baseline setup.** Set up the app, lint, typecheck, test scripts, Git repository, design tokens and first HTML landing page. Request actual verification output.

**Step 4: Implement the vertical slice.** Execute Prompts B and C separately. Aim first for an attractive but simple procedural environment and a working product inspection panel. Do not generate all four detailed zones or the complete admin dashboard at once.

**Step 5: Inspect in the browser.** Test keyboard navigation, focus return, safe CTA, mobile-sized viewport, unsupported WebGL route, visual composition and basic frame smoothness. Capture screenshots and the actual browser console errors as evidence.

**Step 6: Add domain modules in sequence.** Implement product/schema validation and tenant boundaries, then authenticated catalog management, fixed placement and atomic publishing. Keep published public DTOs separate from drafts and admin structures.

**Step 7: Add lead handling and privacy-safe metrics.** Validate forms and consent policy and test rate limiting, PII boundaries and cross-tenant reporting.

**Step 8: Run a real pilot.** Load permitted sample customer products, measure setup effort and user experience, observe actual outcomes and revise the feature backlog before expanding templates.

### Recommended first message to Antigravity

```text
We are developing RealmCanvas, a commercial interactive 3D showroom platform.
Please read AGENTS.md and docs/REALMCANVAS_MASTER_SPEC.md completely.
Treat them as the initial product and engineering source of truth, but flag
contradictions or assumptions. We are starting Task RC-001 only: repository
and quality-tool baseline. Inspect the workspace and give me a precise
implementation plan, likely changed files, dependency risks, acceptance
criteria and test commands. Do not write code or run destructive commands
until I approve your plan. Do not build the full application at once.
```

### Mandatory agent handoff format after each task

```text
Task ID:
Objective:
Implemented behavior:
Files added/changed:
Design decisions and deviations:
Commands actually run + observed results:
Browser/device evidence (if applicable):
Security/privacy/accessibility checks:
Known problems and limitations:
Next smallest recommended task:
```

# 22. References and Verification Notes

These sources support tool behavior and standard requirements. They were consulted for the **12 October 2026** planning baseline. Framework releases, IDE features and hosted-service terms may change; verify versions before installing and follow primary project documentation.

1. Google Antigravity IDE overview: https://www.antigravity.google/docs/ide/overview/
2. Google Antigravity IDE getting started: https://antigravity.google/docs/ide-getting-started
3. Antigravity Rules (workspace rules / `AGENTS.md`): https://www.antigravity.google/docs/rules/
4. Antigravity implementation plan review: https://www.antigravity.google/docs/ide-implementation-plan
5. Antigravity IDE settings and approval policies: https://antigravity.google/docs/ide/settings
6. Antigravity Workflows (transition notice, effective Oct 19 2026): https://www.antigravity.google/docs/ide/workflows/
7. React Three Fiber performance: https://r3f.docs.pmnd.rs/advanced/scaling-performance
8. React Three Fiber performance pitfalls: https://r3f.docs.pmnd.rs/advanced/pitfalls
9. Three.js GLTFLoader: https://threejs.org/docs/pages/GLTFLoader.html
10. Three.js KTX2Loader: https://threejs.org/docs/pages/KTX2Loader.html
11. Core Web Vitals thresholds: https://web.dev/articles/vitals
12. OWASP Top 10:2025: https://top10.owasp.org/2025/0x00_2025-Introduction/
13. Web Content Accessibility Guidelines (WCAG) 2.2: https://www.w3.org/TR/WCAG22/
14. ByondXR virtual store: https://www.byondxr.com/products/virtual-store/
15. ByondXR virtual showroom: https://www.byondxr.com/products/virtual-showroom/
16. Emperia: https://emperiavr.com/
17. Obsess: https://obsessvr.com/

## Provenance, assumptions and caution

This blueprint combines earlier approved creative discussion, architecture recommendations and publicly documented technology practices. It is **not** a completed application, security certification, customer-validation report or legal opinion. Proposed pricing, milestones, visuals and performance budgets are hypotheses or targets. Sample product names and API identifiers are invented fixtures. Final implementation choices must be validated in Antigravity against installed package versions and actual customer constraints.

---

**Final project principle:** Build the smallest commercially credible, beautifully art-directed 3D showroom first. Preserve visitor usability, tenant security, accessibility, reliable publication and measurable customer value while adding technical complexity only where justified.
