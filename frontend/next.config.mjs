/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Vercel optimizations
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
}

export default nextConfig
