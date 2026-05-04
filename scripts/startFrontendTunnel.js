const fs = require("fs");
const path = require("path");
const localtunnel = require("localtunnel");

const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 5173);
const SUBDOMAIN = (process.env.LT_SUBDOMAIN || "").trim();
const ROOT_DIR = path.resolve(__dirname, "..");
const MOBILE_ENV_PATH = path.join(ROOT_DIR, "mobile", ".env");
const MOBILE_ENV_KEY = "EXPO_PUBLIC_WEB_APP_URL";

function upsertEnvValue(rawEnv, key, value) {
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*$`, "m");

  if (regex.test(rawEnv)) {
    return rawEnv.replace(regex, line);
  }

  const normalized = rawEnv.endsWith("\n") || rawEnv.length === 0 ? rawEnv : `${rawEnv}\n`;
  return `${normalized}${line}\n`;
}

function updateMobileEnv(url) {
  let rawEnv = "";
  if (fs.existsSync(MOBILE_ENV_PATH)) {
    rawEnv = fs.readFileSync(MOBILE_ENV_PATH, "utf8");
  }

  const nextEnv = upsertEnvValue(rawEnv, MOBILE_ENV_KEY, url);
  fs.writeFileSync(MOBILE_ENV_PATH, nextEnv, "utf8");
  console.log(`[tunnel] Updated mobile .env with ${MOBILE_ENV_KEY}=${url}`);
}

async function startTunnel() {
  const options = {
    port: FRONTEND_PORT
  };

  if (SUBDOMAIN) {
    options.subdomain = SUBDOMAIN;
  }

  const tunnel = await localtunnel(options);

  console.log(`[tunnel] Frontend tunnel URL: ${tunnel.url}`);
  if (SUBDOMAIN) {
    console.log(`[tunnel] Requested subdomain: ${SUBDOMAIN}`);
  }

  updateMobileEnv(tunnel.url);

  tunnel.on("close", () => {
    console.log("[tunnel] Tunnel closed.");
  });

  const shutdown = async () => {
    console.log("\n[tunnel] Shutting down tunnel...");
    await tunnel.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startTunnel().catch((error) => {
  console.error("[tunnel] Failed to start tunnel:", error.message);
  process.exit(1);
});
