/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui', '@repo/api'],
  // Handle self-signed certificates in development (e.g., corporate proxies)
  ...(process.env.NODE_ENV !== 'production' && {
    experimental: {
      serverActions: {
        bodySizeLimit: '2mb',
      },
    },
  }),
};

// Handle SSL certificate issues in development
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

module.exports = nextConfig;
