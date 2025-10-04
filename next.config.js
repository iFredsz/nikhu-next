/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // terima semua domain https
      },
      {
        protocol: 'http',
        hostname: '**', // kalau ada gambar http (opsional)
      },
    ],
  },
}

module.exports = nextConfig
