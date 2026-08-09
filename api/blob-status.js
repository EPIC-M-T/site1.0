export default function handler(request, response) {
  response.status(200).json({
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    hasVercelBlobToken: Boolean(process.env.VERCEL_BLOB_READ_WRITE_TOKEN)
  });
}
