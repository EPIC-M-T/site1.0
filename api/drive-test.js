export default async function handler(request, response) {
  const url = 'https://drive.google.com/uc?export=download&id=1YgMG5bzxZjE2kOmgps-F5UB5lSYqVxJT';
  try {
    const upstream = await fetch(url, { redirect: 'follow' });
    response.status(200).json({
      status: upstream.status,
      ok: upstream.ok,
      contentType: upstream.headers.get('content-type'),
      contentLength: upstream.headers.get('content-length'),
      finalUrl: upstream.url
    });
  } catch (error) {
    response.status(500).json({ error: String(error) });
  }
}
