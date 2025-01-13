/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false, 
      readline: false,
      // Add these for snarkjs
      crypto: false,
      stream: false,
      path: false,
      os: false
    }
    return config
  },
  // Add configuration for large static files
  experimental: {
    largePageDataBytes: 800 * 1024 * 1024, // 800MB limit
  },
  // Configure headers for large files and CORS
  async headers() {
    return [
      {
        source: '/circuits/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
  // Optional: Configure redirects for circuit files
  async rewrites() {
    return [
      {
        source: '/circuits/:path*',
        destination: '/public/circuits/:path*',
      },
    ]
  }
}

module.exports = nextConfig