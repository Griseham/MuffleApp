const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const teamId = process.env.APPLE_TEAM_ID;
const keyId = process.env.APPLE_KEY_ID;
const keyPath = process.env.APPLE_PRIVATE_KEY_PATH;

if (!teamId || !keyId || !keyPath) {
  throw new Error(
    'Missing required env vars: APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY_PATH'
  );
}

const resolvedKeyPath = path.resolve(process.cwd(), keyPath);
const privateKey = fs.readFileSync(resolvedKeyPath, 'utf8');

const token = jwt.sign(
  {},
  privateKey,
  {
    algorithm: 'ES256',
    expiresIn: '180d',
    issuer: teamId,
    header: {
      alg: 'ES256',
      kid: keyId,
    },
  }
);



