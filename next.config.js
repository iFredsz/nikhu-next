/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

// ✅ Perluas CSP agar mengizinkan Google API & Midtrans
const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.googleapis.com https://www.googletagmanager.com https://apis.google.com https://app.midtrans.com;
  connect-src 'self' https://firestore.googleapis.com https://firebase.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebasestorage.googleapis.com https://storage.googleapis.com wss:;
  img-src * blob: data:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
`.replace(/\n/g, ' ')

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  swcMinify: true,

  compiler: {
    // ✅ Hilangkan console.* di production
    removeConsole: isProd,
  },

  images: {
    // izinkan semua gambar dari HTTPS (termasuk dari Google)
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
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '0' },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), payment=()',
          },
          // ✅ Tambahkan CSP aman dan fleksibel
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
}

module.exports = nextConfig
