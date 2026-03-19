// generateAppleToken.js
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Replace these with your real IDs
const teamId = 'KMDXS3ADSG';      // Apple Developer Team ID
const keyId  = '2SCPX75H8Y';      // Music Key ID (from Apple Dev portal)

// Make sure this path points to your .p8 file
const privateKey = fs.readFileSync('./AuthKey_2SCPX75H8Y.p8', 'utf8');

const token = jwt.sign(
  {},
  privateKey,
  {
    algorithm: 'ES256',
    expiresIn: '180d',   // ~6 months
    issuer: teamId,
    header: {
      alg: 'ES256',
      kid: keyId,
    },
  }
);

console.log('New Apple Music developer token:\n');
console.log(token);
