import { readFileSync } from "node:fs";

/**
 * Server-side configuration. Retailer credentials are read from the environment
 * only and never sent to the browser.
 */

const env = (name: string) => process.env[name]?.trim() || undefined;

function walmartPrivateKey(): string | undefined {
  const inline = env("WALMART_PRIVATE_KEY");
  const path = env("WALMART_PRIVATE_KEY_PATH");
  let raw = inline;
  if (!raw && path) {
    try {
      raw = readFileSync(path, "utf8");
    } catch {
      console.warn(`[config] Couldn't read WALMART_PRIVATE_KEY_PATH (${path}); Walmart is disabled.`);
      return undefined;
    }
  }
  if (!raw) return undefined;
  raw = raw.replace(/\\n/g, "\n").trim();
  // walmart.io's key generator often yields the bare base64 PKCS#8 body.
  if (!raw.includes("-----BEGIN")) {
    const body = raw.replace(/\s+/g, "").match(/.{1,64}/g)!.join("\n");
    raw = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`;
  }
  return raw;
}

export const config = {
  port: Number(env("PORT") ?? 8787),
  webOrigin: env("WEB_ORIGIN") ?? "http://localhost:5173",
  kroger: {
    clientId: env("KROGER_CLIENT_ID"),
    clientSecret: env("KROGER_CLIENT_SECRET"),
    redirectUri: env("KROGER_REDIRECT_URI") ?? "http://localhost:5173/api/kroger/callback",
    apiBase: (env("KROGER_API_BASE") ?? "https://api.kroger.com").replace(/\/$/, ""),
  },
  walmart: {
    consumerId: env("WALMART_CONSUMER_ID"),
    keyVersion: env("WALMART_KEY_VERSION") ?? "1",
    privateKey: walmartPrivateKey(),
    publisherId: env("WALMART_PUBLISHER_ID"),
  },
};

export const krogerConfigured = () => Boolean(config.kroger.clientId && config.kroger.clientSecret);
export const walmartConfigured = () => Boolean(config.walmart.consumerId && config.walmart.privateKey);
