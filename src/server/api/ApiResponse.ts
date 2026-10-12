/**
 * RealmCanvas Standard API Response & Error Helper
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 9.1)
 */

import { NextResponse } from "next/server";

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: ApiErrorDetail[];
  };
}

export function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details: ApiErrorDetail[] = [],
  requestId: string = `req_${crypto.randomUUID().slice(0, 8)}`
): NextResponse<ApiErrorEnvelope> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        requestId,
        details,
      },
    },
    { status }
  );
}

export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  headers: Record<string, string> = {}
): NextResponse<T> {
  return NextResponse.json(data, {
    status,
    headers,
  });
}
