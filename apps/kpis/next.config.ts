const path = require('path');

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
        hostname: '*.isleno.es',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

module.exports = nextConfig;
