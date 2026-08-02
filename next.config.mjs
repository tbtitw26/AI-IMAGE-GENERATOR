/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // pdfkit ships its fonts as .afm data files that Next's server bundler doesn't
  // copy over, causing "ENOENT ... Helvetica.afm" at runtime. Keeping it external
  // means it's require()'d straight from node_modules instead, where those files
  // actually live.
  experimental: {
    serverComponentsExternalPackages: ['pdfkit'],
  },
};

export default nextConfig;
