/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false, 
      readline: false,
      crypto: false,
      stream: false,
      path: false,
      os: false
    }
    config.ignoreWarnings = [
      { module: /node_modules\/web-worker/ }
    ];
    return config
  },
  // Add configuration for large static files
  experimental: {
    largePageDataBytes: 800 * 1024 * 1024, // 800MB limit
  },
  // Optional: Configure headers for large files
  images: {
    domains: ['ipfs.io', 'cloudflare-ipfs.com', 'gateway.pinata.cloud'],
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/circuits/:path*',
        destination: '/public/circuits/:path*',
      },
    ]
  },
  // Suppress the data attributes warning
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
}

module.exports = nextConfig 