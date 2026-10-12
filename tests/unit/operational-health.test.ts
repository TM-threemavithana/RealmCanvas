import { describe, it, expect } from "vitest";
import { GET as handleGetHealth } from "@/app/api/health/route";

describe("Operational Health Probe & Deployment Validation (RC-025)", () => {
  it("GET /api/health returns 200 OK with valid operational metrics", async () => {
    const res = await handleGetHealth();

    expect(res.status).toBe(200);

    // Verify cache prevention headers
    const cacheControl = res.headers.get("cache-control");
    expect(cacheControl).toContain("no-store");
    expect(cacheControl).toContain("no-cache");

    const data = await res.json();

    // Verify health payload schema
    expect(data.status).toBe("healthy");
    expect(data.version).toBe("0.1.0");
    expect(data.service).toBe("realmcanvas");
    expect(typeof data.timestamp).toBe("string");
    expect(new Date(data.timestamp).getTime()).not.toBeNaN();
    expect(typeof data.uptimeSeconds).toBe("number");
    expect(data.uptimeSeconds).toBeGreaterThanOrEqual(0);

    // Verify database status reporting
    expect(data.database).toBeDefined();
    expect(["persistent_postgresql", "in_memory_transient"]).toContain(data.database.mode);
    expect(typeof data.database.configured).toBe("boolean");
  });
});
