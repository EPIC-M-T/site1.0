function clean(value, max = 500) {
  return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(204).end();
  const data = {
    event: clean(req.body?.event, 100),
    path: clean(req.body?.path, 500),
    at: clean(req.body?.at, 80) || new Date().toISOString(),
    properties: req.body?.properties && typeof req.body.properties === 'object' ? req.body.properties : {}
  };
  if (process.env.ANALYTICS_WEBHOOK_URL) {
    try {
      await fetch(process.env.ANALYTICS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Analytics relay failed', error);
    }
  }
  return res.status(204).end();
}
