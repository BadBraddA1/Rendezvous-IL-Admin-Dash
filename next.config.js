const path = require("path")

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
    ],
  },
  // Prevent Turbopack from panicking when node_modules are being updated
  experimental: {
    turbopackMemoryLimit: 4096,
  },
}

module.exports = nextConfig
