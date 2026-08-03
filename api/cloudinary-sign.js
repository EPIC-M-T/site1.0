import crypto from 'node:crypto';

const recentRequests = new Map();

function allowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
}

function setCors(req, res) {
  const origins = allowedOrigins();
  const origin = req.headers.origin;
  if (origin && (origins.length === 0 || origins.includes(origin))) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function isAllowedOrigin(req) {
  const origins = allowedOrigins();
  if (!origins.length) return true;
  const origin = req.headers.origin;
  return !origin || origins.includes(origin);
}

function rateLimited(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const hits = (recentRequests.get(ip) || []).filter(time => now - time < 10 * 60 * 1000);
  hits.push(now);
  recentRequests.set(ip, hits);
  return hits.length > 24;
}

export default async function handler(req, res) {
  setCors(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAllowedOrigin(req)) return res.status(403).json({ error: 'Origin not allowed' });
  if (rateLimited(req)) return res.status(429).json({ error: 'Too many upload requests. Please try again later.' });

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'epic-models-and-talent/applications';
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return res.status(503).json({ error: 'Cloudinary is not configured' });
  }

  const resourceType = ['image', 'video', 'raw'].includes(req.query.resourceType) ? req.query.resourceType : 'image';
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`).digest('hex');

  return res.status(200).json({
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    resourceType
  });
}
