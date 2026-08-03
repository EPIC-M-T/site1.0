const recentRequests = new Map();

function setCors(req, res) {
  const origins = (process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (origin && (origins.length === 0 || origins.includes(origin))) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function isAllowedOrigin(req) {
  const origins = (process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
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
  return hits.length > 8;
}

function cleanText(value, max = 3000) {
  return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
}

function isAllowedMedia(value, expectedType) {
  if (!value || typeof value !== 'object') return false;
  try {
    const url = new URL(String(value.url || ''));
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'epic-models-and-talent/applications';
    const publicId = String(value.publicId || '');
    const resourceType = String(value.resourceType || '');
    if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return false;
    if (cloudName && !url.pathname.includes(`/${cloudName}/`)) return false;
    if (!publicId.startsWith(`${folder}/`) && publicId !== folder) return false;
    if (!['image', 'video', 'raw'].includes(resourceType)) return false;
    if (expectedType && resourceType !== expectedType) return false;
    const bytes = Number(value.bytes || 0);
    return Number.isFinite(bytes) && bytes > 0 && bytes <= 250 * 1024 * 1024;
  } catch {
    return false;
  }
}

function validate(body) {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  if (!['talent_application', 'client_inquiry'].includes(body.submissionType)) return 'Invalid submission type';
  if (!body.fields || typeof body.fields !== 'object') return 'Missing form fields';
  if (body.fields.portfolioWebsiteConfirm || body.fields.companyWebsite) return 'Rejected';
  const email = cleanText(body.fields.email, 320);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'A valid email is required';
  if (body.submissionType === 'talent_application') {
    if (!cleanText(body.fields.legalName, 180) || !cleanText(body.fields.phone, 80) || !cleanText(body.fields.dateOfBirth, 40)) return 'Required applicant details are missing';
    if (!isAllowedMedia(body.media?.headshot, 'image') || !isAllowedMedia(body.media?.fullBody, 'image')) return 'Valid headshot and full-body uploads are required';
    if (body.media?.compCard && !isAllowedMedia(body.media.compCard)) return 'Invalid comp-card upload';
    if (body.media?.reel && !isAllowedMedia(body.media.reel, 'video')) return 'Invalid reel upload';
  } else if (!cleanText(body.fields.name, 180) || !cleanText(body.fields.company, 180) || !cleanText(body.fields.details, 5000)) {
    return 'Required client inquiry details are missing';
  }
  return null;
}

function sanitizePayload(body, req) {
  const fields = Object.fromEntries(Object.entries(body.fields || {}).map(([key, value]) => [cleanText(key, 80), cleanText(value, key === 'details' || key === 'experience' ? 6000 : 1500)]));
  const media = Object.fromEntries(Object.entries(body.media || {}).map(([key, value]) => [cleanText(key, 80), {
    url: cleanText(value?.url, 1200), publicId: cleanText(value?.publicId, 400), resourceType: cleanText(value?.resourceType, 30), bytes: Number(value?.bytes || 0)
  }]));
  return {
    submissionType: body.submissionType,
    submittedAt: cleanText(body.submittedAt, 80) || new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    sourcePage: cleanText(body.sourcePage, 1000),
    fields,
    media,
    metadata: {
      userAgent: cleanText(req.headers['user-agent'], 500),
      forwardedFor: cleanText(req.headers['x-forwarded-for'], 200),
      vercelId: cleanText(req.headers['x-vercel-id'], 200)
    }
  };
}

export default async function handler(req, res) {
  setCors(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAllowedOrigin(req)) return res.status(403).json({ error: 'Origin not allowed' });
  if (rateLimited(req)) return res.status(429).json({ error: 'Too many submissions. Please try again later.' });

  const error = validate(req.body);
  if (error === 'Rejected') return res.status(200).json({ ok: true });
  if (error) return res.status(400).json({ error });
  if (!process.env.GAS_WEB_APP_URL || !process.env.GAS_SHARED_SECRET) return res.status(503).json({ error: 'Google Apps Script relay is not configured' });

  const payload = sanitizePayload(req.body, req);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(process.env.GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-EPIC-Relay-Secret': process.env.GAS_SHARED_SECRET || '' },
      body: JSON.stringify({ ...payload, relayToken: process.env.GAS_SHARED_SECRET }),
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`GAS returned ${response.status}: ${text.slice(0, 180)}`);
    return res.status(200).json({ ok: true, submissionType: payload.submissionType });
  } catch (err) {
    console.error('EPIC relay error', err);
    return res.status(502).json({ error: 'The secure relay is temporarily unavailable. Please contact EPIC directly.' });
  } finally {
    clearTimeout(timeout);
  }
}
