import type { NextRequest } from "next/server";

import { auth0 } from "@/lib/auth0";

export async function GET(request: NextRequest) {
  const screenHint = request.nextUrl.searchParams.get("screen_hint") ?? undefined;
  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/app";

  return auth0.startInteractiveLogin({
    returnTo,
    authorizationParameters: {
      ...(screenHint ? { screen_hint: screenHint } : {}),
    },
  });
}
