/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.googleapis.com https://www.googletagmanager.com https://app.midtrans.com https://api.midtrans.com https://apis.google.com;
  connect-src 'self' https://app.midtrans.com https://api.midtrans.com https://firestore.googleapis.com https://firebase.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebasestorage.googleapis.com https://storage.googleapis.com wss:;
  img-src * blob: data:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  frame-src 'self' https://app.midtrans.com https://naka-studio.firebaseapp.com https://*.google.com https://*.firebaseapp.com;
  child-src 'self' https://app.midtrans.com https://naka-studio.firebaseapp.com https://*.google.com https://*.firebaseapp.com;
`.replace(/\n/g, ' ')


const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  swcMinify: true,

  compiler: { removeConsole: isProd },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), payment=()' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
}

module.exports = nextConfig
