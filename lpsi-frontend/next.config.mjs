import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
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

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
