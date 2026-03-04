/**
 * POST /api/keys — Create a new API key
 * GET  /api/keys — List API keys (hashes only)
 *
 * SEC-010: API keys are SHA-256 hashed before storage.
 * Plaintext is returned ONCE at creation time and never stored.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateApiKey } from "@/lib/security/api-keys";

// NOTE: This route requires an api_keys table (to be added in a future migration).
// For now, this demonstrates the secure key creation pattern.

export async function POST(_request: NextRequest): Promise<NextResponse> {
  // TODO: Verify session / workspace ownership (SEC-009)

  const { plaintext, hash } = generateApiKey();

  // TODO: Store `hash` in api_keys table with workspace_id
  // await db.insert(apiKeys).values({ keyHash: hash, workspaceId: ... });

  // SEC-010: Return plaintext only once — it is never stored
  return NextResponse.json(
    {
      status: "success",
      data: {
        key: plaintext,
        keyPrefix: plaintext.slice(0, 10) + "...",
        message: "Store this key securely. It will not be shown again.",
      },
    },
    { status: 201 },
  );
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  // TODO: Verify session / workspace ownership (SEC-009)
  // TODO: Query api_keys table — return only prefix + created_at, never the hash

  return NextResponse.json({
    status: "success",
    data: { keys: [] },
  });
}
