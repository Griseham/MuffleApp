// generateToken.js
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Load your private key
const privateKey = fs.readFileSync('./AuthKey_FM64PH5QZM.p8');

// Build the token
const token = jwt.sign(
  {},  // no extra claims in the body
  privateKey,
  {
    algorithm: 'ES256',
    expiresIn: '180d',                   // 180 days
    issuer: 'KMDXS3ADSG',               // your Team ID
    header: {
      alg: 'ES256',
      kid: 'FM64PH5QZM'                 // your Key ID
    }
  }
);

console.log(token);
