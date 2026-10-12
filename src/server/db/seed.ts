/**
 * RealmCanvas Pilot Seed Dataset Generator
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 4, Section 8.2, Section 14)
 */

import type {
  Organization,
  User,
  Membership,
  Showroom,
  ShowroomRevision,
  Publication,
  Product,
  ProductVariant,
  Placement,
} from "./schema";

export interface PilotSeedDataset {
  organization: Organization;
  users: {
    alice: User;
    bob: User;
    charlie: User;
  };
  memberships: Membership[];
  products: Product[];
  variants: ProductVariant[];
  showroom: Showroom;
  revision: ShowroomRevision;
  publication: Publication;
  placements: Placement[];
}

export function generateSeedDataset(): PilotSeedDataset {
  const now = new Date("2026-10-12T00:00:00.000Z");

  const organization: Organization = {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "celestial-sound",
    name: "Celestial Sound Labs",
    plan: "pro",
    createdAt: now,
    updatedAt: now,
  };

  const alice: User = {
    id: "00000000-0000-4000-8000-000000000011",
    authSubject: "auth0|alice_celestial",
    email: "alice@celestial.test",
    displayName: "Alice Owner",
    createdAt: now,
    updatedAt: now,
  };

  const bob: User = {
    id: "00000000-0000-4000-8000-000000000012",
    authSubject: "auth0|bob_celestial",
    email: "bob@celestial.test",
    displayName: "Bob Editor",
    createdAt: now,
    updatedAt: now,
  };

  const charlie: User = {
    id: "00000000-0000-4000-8000-000000000013",
    authSubject: "auth0|charlie_celestial",
    email: "charlie@celestial.test",
    displayName: "Charlie Analyst",
    createdAt: now,
    updatedAt: now,
  };

  const memberships: Membership[] = [
    {
      id: "00000000-0000-4000-8000-000000000021",
      organizationId: organization.id,
      userId: alice.id,
      role: "owner",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "00000000-0000-4000-8000-000000000022",
      organizationId: organization.id,
      userId: bob.id,
      role: "editor",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "00000000-0000-4000-8000-000000000023",
      organizationId: organization.id,
      userId: charlie.id,
      role: "analyst",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const aurora: Product = {
    id: "00000000-0000-4000-8000-000000000031",
    organizationId: organization.id,
    slug: "aurora-headphones",
    name: "Aurora Precision Wireless Headphones",
    summary: "Flagship acoustic monitor with titanium dynamic drivers and adaptive noise cancellation.",
    status: "published",
    ctaUrl: "https://example.com/products/aurora-headphones",
    createdAt: now,
    updatedAt: now,
  };

  const solaris: Product = {
    id: "00000000-0000-4000-8000-000000000032",
    organizationId: organization.id,
    slug: "solaris-monitor",
    name: "Solaris Reference Monitor",
    summary: "Planar magnetic open-back reference studio monitor for mixing and mastering.",
    status: "published",
    ctaUrl: "https://example.com/products/solaris-monitor",
    createdAt: now,
    updatedAt: now,
  };

  const zenith: Product = {
    id: "00000000-0000-4000-8000-000000000033",
    organizationId: organization.id,
    slug: "zenith-dac",
    name: "Zenith Studio DAC",
    summary: "Lossless 32-bit / 768kHz balanced headphone amplifier and discrete resistor DAC.",
    status: "published",
    ctaUrl: "https://example.com/products/zenith-dac",
    createdAt: now,
    updatedAt: now,
  };

  const products = [aurora, solaris, zenith];

  const variants: ProductVariant[] = [
    {
      id: "00000000-0000-4000-8000-000000000041",
      productId: aurora.id,
      label: "Midnight Obsidian",
      attributes: { colorHex: "#0D1117", material: "composite" },
      displayOrder: 0,
      createdAt: now,
    },
    {
      id: "00000000-0000-4000-8000-000000000042",
      productId: aurora.id,
      label: "Pearl Titanium",
      attributes: { colorHex: "#E2E8F0", material: "brushed_titanium" },
      displayOrder: 1,
      createdAt: now,
    },
  ];

  const showroomId = "00000000-0000-4000-8000-000000000051";
  const publicationId = "00000000-0000-4000-8000-000000000071";

  const showroom: Showroom = {
    id: showroomId,
    organizationId: organization.id,
    slug: "celestial-pavilion",
    title: "Celestial Tech Pavilion",
    templateId: "celestial-tech-pavilion-v1",
    activePublicationId: publicationId,
    createdAt: now,
    updatedAt: now,
  };

  const revision: ShowroomRevision = {
    id: "00000000-0000-4000-8000-000000000061",
    showroomId,
    revisionNumber: 1,
    draftConfig: {
      accentColor: "#37ddeb",
      ambientLighting: 0.65,
    },
    editedBy: alice.id,
    updatedAt: now,
  };

  const publication: Publication = {
    id: publicationId,
    showroomId,
    revisionId: revision.id,
    manifest: {
      schemaVersion: 1,
      publicationId,
      templateId: "celestial-tech-pavilion-v1",
      branding: {
        displayName: "Celestial Sound Labs",
        accentColor: "#37ddeb",
      },
      placements: [
        {
          slotKey: "featured-hero",
          productId: aurora.id,
          interaction: "inspect_product",
          displayOptions: { scale: 1.0, defaultVariantId: variants[0].id },
        },
      ],
    },
    publishedBy: alice.id,
    publishedAt: now,
  };

  const placements: Placement[] = [
    {
      id: "00000000-0000-4000-8000-000000000081",
      showroomRevisionId: revision.id,
      slotKey: "featured-hero",
      productId: aurora.id,
      config: { scale: 1.0 },
    },
    {
      id: "00000000-0000-4000-8000-000000000082",
      showroomRevisionId: revision.id,
      slotKey: "gallery-01",
      productId: solaris.id,
      config: { scale: 1.0 },
    },
    {
      id: "00000000-0000-4000-8000-000000000083",
      showroomRevisionId: revision.id,
      slotKey: "gallery-02",
      productId: zenith.id,
      config: { scale: 1.0 },
    },
  ];

  return {
    organization,
    users: { alice, bob, charlie },
    memberships,
    products,
    variants,
    showroom,
    revision,
    publication,
    placements,
  };
}
