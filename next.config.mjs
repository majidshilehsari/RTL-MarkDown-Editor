/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Fully static export: the whole app runs in the browser (no API routes,
  // no server actions, no middleware), so Next.js can emit plain HTML/JS/CSS
  // into ./out which Cloudflare Workers serves as static assets.
  output: 'export',

  // next/image optimization needs a server; disable it for the static export.
  images: { unoptimized: true },

  // Emit /index.html style folders so every route works behind a static host.
  trailingSlash: true,
};

export default nextConfig;
