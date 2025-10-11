/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // sembunyikan header X-Powered-By
  swcMinify: true,

  images: {
    // izinkan semua gambar HTTPS (termasuk dari Google)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Paksa HTTPS dan lindungi subdomain
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Anti klikjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Jangan tebak tipe file
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Kebijakan referer aman
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Matikan XSS Protection lawas
          { key: 'X-XSS-Protection', value: '0' },
          // Batasi izin fitur browser
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=()' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
