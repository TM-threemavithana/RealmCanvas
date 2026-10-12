/**
 * GET /api/health
 * Operational health check and readiness probe for container orchestrators,
 * load balancers, and monitoring systems.
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 16.2, Section 16.3)
 */

import { NextResponse } from "next/server";
import { getDatabaseStatus } from "@/server/db/client";

const SERVER_START_TIME = Date.now();

export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - SERVER_START_TIME) / 1000);
  const dbStatus = getDatabaseStatus();

  const healthData = {
    status: "healthy",
    version: "0.1.0",
    service: "realmcanvas",
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    database: {
      mode: dbStatus.mode,
      configured: dbStatus.configured,
    },
    environment: process.env.NODE_ENV || "development",
  };

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Content-Type": "application/json",
    },
  });
}
