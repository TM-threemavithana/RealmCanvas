/**
 * RealmCanvas Server Service Registry & Dependency Injection Root
 * Complies with REALMCANVAS_MASTER_SPEC.md (Modular Monolith)
 */

import { InMemoryTenantRepository } from "./tenancy/TenantRepository";
import { TenantService } from "./tenancy/TenantService";
import { InMemoryCatalogRepository } from "./catalog/CatalogRepository";
import { CatalogService } from "./catalog/CatalogService";
import { InMemoryShowroomRepository } from "./showrooms/ShowroomRepository";
import { PublishingService } from "./showrooms/PublishingService";
import { PlacementEditor } from "./showrooms/PlacementEditor";
import { InMemoryLeadRepository } from "./leads/LeadRepository";
import { LeadService } from "./leads/LeadService";
import { InMemoryAnalyticsRepository } from "./analytics/AnalyticsRepository";
import { AnalyticsService } from "./analytics/AnalyticsService";

export class ServiceContainer {
  public readonly tenantRepo: InMemoryTenantRepository;
  public readonly tenantService: TenantService;

  public readonly catalogRepo: InMemoryCatalogRepository;
  public readonly catalogService: CatalogService;

  public readonly showroomRepo: InMemoryShowroomRepository;
  public readonly publishingService: PublishingService;
  public readonly placementEditor: PlacementEditor;

  public readonly leadRepo: InMemoryLeadRepository;
  public readonly leadService: LeadService;

  public readonly analyticsRepo: InMemoryAnalyticsRepository;
  public readonly analyticsService: AnalyticsService;

  constructor() {
    this.tenantRepo = new InMemoryTenantRepository();
    this.tenantService = new TenantService(this.tenantRepo);

    this.catalogRepo = new InMemoryCatalogRepository();
    this.catalogService = new CatalogService(this.catalogRepo, this.tenantService);

    this.showroomRepo = new InMemoryShowroomRepository();
    this.publishingService = new PublishingService(
      this.showroomRepo,
      this.tenantService,
      this.catalogService
    );
    this.placementEditor = new PlacementEditor(
      this.publishingService,
      this.tenantService,
      this.catalogService
    );

    this.leadRepo = new InMemoryLeadRepository();
    this.leadService = new LeadService(this.leadRepo, this.tenantService);

    this.analyticsRepo = new InMemoryAnalyticsRepository();
    this.analyticsService = new AnalyticsService(this.analyticsRepo, this.tenantService);
  }
}

// Global server singleton
const globalForServices = globalThis as unknown as {
  __realmCanvasServices?: ServiceContainer;
};

export const services =
  globalForServices.__realmCanvasServices ?? new ServiceContainer();

if (process.env.NODE_ENV !== "production") {
  globalForServices.__realmCanvasServices = services;
}
