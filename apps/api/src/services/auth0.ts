import { createRemoteJWKSet, jwtVerify } from "jose";

import { env } from "../config/env.js";

const getIssuer = () => `https://${env.auth0Domain}/`;
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

const getJwks = () => {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${env.auth0Domain}/.well-known/jwks.json`));
  }

  return jwks;
};

export type Auth0Profile = {
  sub: string;
  email: string;
};

async function fetchUserInfo(token: string) {
  const response = await fetch(`https://${env.auth0Domain}/userinfo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Auth0 userinfo request failed with status ${response.status}`);
  }

  return (await response.json()) as Partial<Auth0Profile>;
}

export async function verifyAuth0AccessToken(token: string): Promise<Auth0Profile> {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: getIssuer(),
    audience: env.auth0Audience,
  });

  const userInfo = await fetchUserInfo(token);
  const sub = typeof userInfo.sub === "string" ? userInfo.sub : typeof payload.sub === "string" ? payload.sub : null;
  const email = typeof userInfo.email === "string" ? userInfo.email : typeof payload.email === "string" ? payload.email : null;

  if (!sub || !email) {
    throw new Error("Auth0 token missing required claims");
  }

  return { sub, email };
}
