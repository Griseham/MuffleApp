import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};

const TEAM_ID = getArg("--team") || process.env.APPLE_TEAM_ID || "";
const KEY_ID = getArg("--key") || process.env.APPLE_KEY_ID || "";
const PRIVATE_KEY_PATH =
  getArg("--p8") ||
  process.env.APPLE_PRIVATE_KEY_PATH ||
  path.resolve(__dirname, "AuthKey.p8");

if (!TEAM_ID || !KEY_ID || !PRIVATE_KEY_PATH) {
  
  process.exit(1);
}

const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");
const now = Math.floor(Date.now() / 1000);
const exp = now + 180 * 24 * 60 * 60;

const header = {
  alg: "ES256",
  kid: KEY_ID,
  typ: "JWT",
};

const payload = {
  iss: TEAM_ID,
  iat: now,
  exp,
};

const base64url = (input) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const encodedHeader = base64url(JSON.stringify(header));
const encodedPayload = base64url(JSON.stringify(payload));
const signingInput = `${encodedHeader}.${encodedPayload}`;

const signer = crypto.createSign("SHA256");
signer.update(signingInput);
signer.end();

const signature = signer.sign(
  { key: privateKey, dsaEncoding: "ieee-p1363" },
  "base64"
);

const _encodedSignature = signature
  .replace(/=/g, "")
  .replace(/\+/g, "-")
  .replace(/\//g, "_");


