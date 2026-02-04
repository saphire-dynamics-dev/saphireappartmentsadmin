/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['cloudinary'],
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
  },
}

module.exports = nextConfig
