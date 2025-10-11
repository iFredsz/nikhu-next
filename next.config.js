/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, 
  swcMinify: true,

  compiler: {

    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
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
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), payment=()' },
          // Tambahan perlindungan CSP (Content Security Policy) dasar
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' https:; img-src * blob: data:; style-src 'self' 'unsafe-inline' https:; font-src 'self' https: data:;",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig