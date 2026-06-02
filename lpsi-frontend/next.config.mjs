/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'lpsi.brmp-ruminansia.go.id',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
