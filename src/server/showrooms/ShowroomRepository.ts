/**
 * RealmCanvas Showroom Repository Interface & In-Memory Implementation
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 3.4, Section 8.2, Section 8.4)
 */

import type {
  Showroom,
  ShowroomRevision,
  Publication,
  ShowroomDraftConfig,
  PublicSceneManifest,
} from "./ShowroomSchema";

export class RevisionConflictError extends Error {
  public readonly statusCode = 409;
  constructor(message = "Conflict: Showroom draft has been modified by another editor.") {
    super(message);
    this.name = "RevisionConflictError";
  }
}

export interface IShowroomRepository {
  createShowroom(input: {
    organizationId: string;
    slug: string;
    title: string;
    templateId?: "celestial-tech-pavilion-v1";
  }): Promise<Showroom>;
  findShowroomById(organizationId: string, showroomId: string): Promise<Showroom | null>;
  findShowroomBySlug(organizationId: string, slug: string): Promise<Showroom | null>;
  findShowroomByGlobalSlug(slug: string): Promise<Showroom | null>;

  createRevision(input: {
    showroomId: string;
    revisionNumber: number;
    draftConfig: ShowroomDraftConfig;
    editedBy: string;
  }): Promise<ShowroomRevision>;
  getLatestRevision(showroomId: string): Promise<ShowroomRevision | null>;
  getRevisionByNumber(showroomId: string, revisionNumber: number): Promise<ShowroomRevision | null>;
  updateRevision(input: {
    showroomId: string;
    expectedRevisionNumber: number;
    newConfig: ShowroomDraftConfig;
    editedBy: string;
  }): Promise<ShowroomRevision>;

  createPublication(input: {
    showroomId: string;
    revisionId: string;
    manifest: PublicSceneManifest;
    publishedBy: string;
  }): Promise<Publication>;
  findPublicationById(publicationId: string): Promise<Publication | null>;
  setActivePublication(showroomId: string, publicationId: string): Promise<Showroom>;
  findActivePublication(showroomId: string): Promise<Publication | null>;

  clear(): Promise<void>;
}

export class InMemoryShowroomRepository implements IShowroomRepository {
  private showrooms = new Map<string, Showroom>();
  private revisions = new Map<string, ShowroomRevision>(); // id -> revision
  private showroomRevisions = new Map<string, string[]>(); // showroomId -> revisionIds[]
  private publications = new Map<string, Publication>(); // id -> publication

  public async createShowroom(input: {
    organizationId: string;
    slug: string;
    title: string;
    templateId?: "celestial-tech-pavilion-v1";
  }): Promise<Showroom> {
    const existing = await this.findShowroomBySlug(input.organizationId, input.slug);
    if (existing) {
      throw new Error(`Showroom slug "${input.slug}" already exists in organization "${input.organizationId}"`);
    }

    const showroom: Showroom = {
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      slug: input.slug.toLowerCase().trim(),
      title: input.title.trim(),
      templateId: input.templateId ?? "celestial-tech-pavilion-v1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.showrooms.set(showroom.id, showroom);
    this.showroomRevisions.set(showroom.id, []);
    return showroom;
  }

  public async findShowroomById(organizationId: string, showroomId: string): Promise<Showroom | null> {
    const s = this.showrooms.get(showroomId);
    if (!s || s.organizationId !== organizationId) return null;
    return s;
  }

  public async findShowroomBySlug(organizationId: string, slug: string): Promise<Showroom | null> {
    const normalized = slug.toLowerCase().trim();
    for (const s of this.showrooms.values()) {
      if (s.organizationId === organizationId && s.slug === normalized) {
        return s;
      }
    }
    return null;
  }

  public async findShowroomByGlobalSlug(slug: string): Promise<Showroom | null> {
    const normalized = slug.toLowerCase().trim();
    for (const s of this.showrooms.values()) {
      if (s.slug === normalized) {
        return s;
      }
    }
    return null;
  }

  public async createRevision(input: {
    showroomId: string;
    revisionNumber: number;
    draftConfig: ShowroomDraftConfig;
    editedBy: string;
  }): Promise<ShowroomRevision> {
    const revision: ShowroomRevision = {
      id: crypto.randomUUID(),
      showroomId: input.showroomId,
      revisionNumber: input.revisionNumber,
      draftConfig: input.draftConfig,
      editedBy: input.editedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.revisions.set(revision.id, revision);
    const revList = this.showroomRevisions.get(input.showroomId) || [];
    revList.push(revision.id);
    this.showroomRevisions.set(input.showroomId, revList);

    return revision;
  }

  public async getLatestRevision(showroomId: string): Promise<ShowroomRevision | null> {
    const revIds = this.showroomRevisions.get(showroomId);
    if (!revIds || revIds.length === 0) return null;

    let latest: ShowroomRevision | null = null;
    for (const id of revIds) {
      const rev = this.revisions.get(id);
      if (rev && (!latest || rev.revisionNumber > latest.revisionNumber)) {
        latest = rev;
      }
    }
    return latest;
  }

  public async getRevisionByNumber(showroomId: string, revisionNumber: number): Promise<ShowroomRevision | null> {
    const revIds = this.showroomRevisions.get(showroomId);
    if (!revIds) return null;

    for (const id of revIds) {
      const rev = this.revisions.get(id);
      if (rev && rev.revisionNumber === revisionNumber) {
        return rev;
      }
    }
    return null;
  }

  /**
   * Updates draft configuration enforcing optimistic concurrency control (Section 8.4).
   * Throws RevisionConflictError if expectedRevisionNumber does not match the latest revision.
   */
  public async updateRevision(input: {
    showroomId: string;
    expectedRevisionNumber: number;
    newConfig: ShowroomDraftConfig;
    editedBy: string;
  }): Promise<ShowroomRevision> {
    const latest = await this.getLatestRevision(input.showroomId);
    if (!latest) {
      throw new Error(`Showroom "${input.showroomId}" has no existing revision history.`);
    }

    if (latest.revisionNumber !== input.expectedRevisionNumber) {
      throw new RevisionConflictError(
        `Optimistic lock failure: expected revision ${input.expectedRevisionNumber}, but latest is ${latest.revisionNumber}.`
      );
    }

    const nextRevisionNumber = latest.revisionNumber + 1;
    return this.createRevision({
      showroomId: input.showroomId,
      revisionNumber: nextRevisionNumber,
      draftConfig: input.newConfig,
      editedBy: input.editedBy,
    });
  }

  public async createPublication(input: {
    showroomId: string;
    revisionId: string;
    manifest: PublicSceneManifest;
    publishedBy: string;
  }): Promise<Publication> {
    const publication: Publication = {
      id: input.manifest.publicationId || crypto.randomUUID(),
      showroomId: input.showroomId,
      revisionId: input.revisionId,
      manifest: input.manifest,
      publishedBy: input.publishedBy,
      publishedAt: new Date(),
    };

    this.publications.set(publication.id, publication);
    return publication;
  }

  public async findPublicationById(publicationId: string): Promise<Publication | null> {
    return this.publications.get(publicationId) || null;
  }

  public async setActivePublication(showroomId: string, publicationId: string): Promise<Showroom> {
    const showroom = this.showrooms.get(showroomId);
    if (!showroom) {
      throw new Error(`Showroom "${showroomId}" does not exist.`);
    }

    const updated: Showroom = {
      ...showroom,
      activePublicationId: publicationId,
      updatedAt: new Date(),
    };

    this.showrooms.set(showroomId, updated);
    return updated;
  }

  public async findActivePublication(showroomId: string): Promise<Publication | null> {
    const showroom = this.showrooms.get(showroomId);
    if (!showroom || !showroom.activePublicationId) return null;
    return this.publications.get(showroom.activePublicationId) || null;
  }

  public async clear(): Promise<void> {
    this.showrooms.clear();
    this.revisions.clear();
    this.showroomRevisions.clear();
    this.publications.clear();
  }
}
