/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.googleapis.com https://www.googletagmanager.com;
  connect-src 'self' https://firestore.googleapis.com https://firebase.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebasestorage.googleapis.com https://storage.googleapis.com https://www.googleapis.com https://www.googleapis.com/* wss:;
  img-src * blob: data:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
`.replace(/\n/g, ' ')

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  swcMinify: true,

  // Hapus semua console.* di production
  compiler: {
    removeConsole: isProd,
  },

  images: {
    // izinkan semua gambar HTTPS (termasuk Google image urls)
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
          // HSTS (force HTTPS)
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '0' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), payment=()' },
          // CSP yang sudah mengizinkan Firebase / Firestore / Storage
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },

  // jika kamu memerlukan tweak buat undici/fetch di server, bisa tambahkan
  // experimental: { esmExternals: 'loose' },
}

module.exports = nextConfig
