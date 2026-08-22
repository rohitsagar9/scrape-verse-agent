/** @type {import('next').NextConfig} */
// NOTE: Do NOT add `output: 'export'` here — that disables API routes.
// For Vercel deployment, Vercel auto-handles serverless functions from pages/api/.
// For a true static export (no API routes), run: NEXT_STATIC=1 npm run build
const nextConfig = {
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  // Allow the dashboard to read JSON files from the parent repo directory
  // when running locally (API routes read ../logs/, ../heal/ etc.)
};

module.exports = nextConfig;
