const path = require('path');
const withNextIntl = require('next-intl/plugin')('./src/i18n.ts');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'monday.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.monday.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.isleno.es',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

module.exports = withNextIntl(nextConfig);
