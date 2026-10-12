-- =========================================================================
-- RealmCanvas Initial Relational Schema Migration (0001_initial_schema.sql)
-- Complies with REALMCANVAS_MASTER_SPEC.md (Section 8.1, Section 8.2, Section 8.3)
-- Multi-Tenant Modular Monolith Schema Definition
-- =========================================================================

-- 1. ORGANIZATIONS (TENANTS)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(32) NOT NULL DEFAULT 'starter',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_organizations_slug UNIQUE (slug),
    CONSTRAINT chk_organizations_plan CHECK (plan IN ('starter', 'pro', 'enterprise'))
);

-- 2. USERS (ADMIN ACCOUNTS)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_subject VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_auth_subject UNIQUE (auth_subject)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- 3. MEMBERSHIPS (RBAC: OWNER > EDITOR > ANALYST)
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_memberships_org_user UNIQUE (organization_id, user_id),
    CONSTRAINT chk_memberships_role CHECK (role IN ('owner', 'editor', 'analyst')),
    CONSTRAINT chk_memberships_status CHECK (status IN ('active', 'invited', 'suspended'))
);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org_id ON memberships (organization_id);

-- 4. SHOWROOMS
CREATE TABLE IF NOT EXISTS showrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    slug VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    template_id VARCHAR(64) NOT NULL DEFAULT 'celestial-tech-pavilion-v1',
    active_publication_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_showrooms_org_slug UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_showrooms_organization_id ON showrooms (organization_id);

-- 5. SHOWROOM REVISIONS (DRAFTS WITH OPTIMISTIC CONCURRENCY CONTROL)
CREATE TABLE IF NOT EXISTS showroom_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    showroom_id UUID NOT NULL REFERENCES showrooms(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    draft_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    edited_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_showroom_revisions_number UNIQUE (showroom_id, revision_number),
    CONSTRAINT chk_showroom_revisions_number CHECK (revision_number >= 1)
);

CREATE INDEX IF NOT EXISTS idx_revisions_showroom_id ON showroom_revisions (showroom_id);

-- 6. PUBLICATIONS (IMMUTABLE PUBLISHED SCENE SNAPSHOTS)
CREATE TABLE IF NOT EXISTS publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    showroom_id UUID NOT NULL REFERENCES showrooms(id) ON DELETE CASCADE,
    revision_id UUID NOT NULL REFERENCES showroom_revisions(id) ON DELETE RESTRICT,
    manifest JSONB NOT NULL,
    published_by UUID NOT NULL REFERENCES users(id),
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_publications_showroom_published ON publications (showroom_id, published_at DESC);

-- Circular FK for active_publication_id on showrooms
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_showrooms_active_publication'
    ) THEN
        ALTER TABLE showrooms
        ADD CONSTRAINT fk_showrooms_active_publication
        FOREIGN KEY (active_publication_id) REFERENCES publications(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 7. PRODUCTS (CATALOG REPOSITORY)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    slug VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'draft',
    cta_url VARCHAR(2048) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_products_org_slug UNIQUE (organization_id, slug),
    CONSTRAINT chk_products_status CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_products_organization_id ON products (organization_id);

-- 8. PRODUCT VARIANTS (PBR MATERIAL & MODEL SWAPS)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    model_asset_id UUID,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_product_order ON product_variants (product_id, display_order ASC);

-- 9. ASSETS (3D GLB, HDR, IMAGES WITH CHECKSUM & MIME VALIDATION)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    object_key VARCHAR(512) NOT NULL,
    content_type VARCHAR(128) NOT NULL,
    bytes BIGINT NOT NULL,
    state VARCHAR(32) NOT NULL DEFAULT 'pending',
    checksum VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_assets_object_key UNIQUE (object_key),
    CONSTRAINT chk_assets_bytes CHECK (bytes > 0),
    CONSTRAINT chk_assets_state CHECK (state IN ('pending', 'uploaded', 'quarantined', 'verified', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_assets_org_state ON assets (organization_id, state);

-- Circular FK for model_asset_id on product_variants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_variants_model_asset'
    ) THEN
        ALTER TABLE product_variants
        ADD CONSTRAINT fk_variants_model_asset
        FOREIGN KEY (model_asset_id) REFERENCES assets(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 10. PLACEMENTS (SLOT KEY BINDINGS WITH BOUNDED SCALE)
CREATE TABLE IF NOT EXISTS placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    showroom_revision_id UUID NOT NULL REFERENCES showroom_revisions(id) ON DELETE CASCADE,
    slot_key VARCHAR(64) NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT uq_placements_revision_slot UNIQUE (showroom_revision_id, slot_key)
);

CREATE INDEX IF NOT EXISTS idx_placements_product_id ON placements (product_id);

-- 11. LEADS (CONVERSIONS WITH EXPLICIT OPT-IN CONSENT)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    showroom_id UUID NOT NULL REFERENCES showrooms(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    contact JSONB NOT NULL,
    consent BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(32) NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_leads_consent CHECK (consent = TRUE),
    CONSTRAINT chk_leads_status CHECK (status IN ('new', 'contacted', 'qualified', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_leads_org_created ON leads (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_showroom_created ON leads (showroom_id, created_at DESC);

-- 12. ANALYTICS EVENTS (WHITELISTED TELEMETRY WITHOUT RAW PII)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    showroom_id UUID NOT NULL REFERENCES showrooms(id) ON DELETE CASCADE,
    publication_id UUID REFERENCES publications(id) ON DELETE SET NULL,
    session_token_hash VARCHAR(128),
    event_type VARCHAR(64) NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_org_recorded ON analytics_events (organization_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_showroom_recorded ON analytics_events (showroom_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_type_recorded ON analytics_events (event_type, recorded_at DESC);

-- 13. AUDIT LOGS (IMMUTABLE APPEND-ONLY TRAIL FOR ADMIN ACTIONS)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(128) NOT NULL,
    entity VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON audit_logs (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity, entity_id);
