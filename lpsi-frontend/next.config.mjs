/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'lpsi.brmprb.site',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'lab.brmprb.site',
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
