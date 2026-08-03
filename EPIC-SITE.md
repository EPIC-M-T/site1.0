# EPIC Models & Talent production site

## Production branch

`epic-models-and-talent-production`

## Hero video URLs

Edit only [`hero-urls.json`](./hero-urls.json) when replacing the desktop or mobile hero video:

```json
{
  "desktop": "PUBLIC_DESKTOP_MP4_URL",
  "mobile": "PUBLIC_MOBILE_MP4_URL"
}
```

The build validates and applies those URLs automatically.

## Vercel configuration

- Vercel project: `epic-models-and-talent`
- Repository: `EPIC-M-T/site1.0`
- Production branch: `epic-models-and-talent-production`
- Root directory: repository root
- Build command: `npm run build`
- Output directory: `dist`
- Node.js: 24.x

## Live site

https://epic-models-and-talent.vercel.app
