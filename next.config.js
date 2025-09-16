/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['cloudinary']
  },
  api: {
    bodyParser: {
      sizeLimit: '35mb',
    },
  },
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
  },
}

module.exports = nextConfig
