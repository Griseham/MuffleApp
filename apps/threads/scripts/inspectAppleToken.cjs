const token = process.env.APPLE_DEVELOPER_TOKEN;

if (!token) {
  throw new Error('Missing APPLE_DEVELOPER_TOKEN');
}

const parts = token.split('.');

if (parts.length !== 3) {
  throw new Error('APPLE_DEVELOPER_TOKEN is not a valid JWT');
}

const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));

console.log('Payload:', payload);
console.log('iat (issued at):', new Date(payload.iat * 1000).toISOString());
console.log('exp (expires at):', new Date(payload.exp * 1000).toISOString());
console.log('iss (team id):', payload.iss);
