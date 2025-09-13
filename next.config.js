/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
