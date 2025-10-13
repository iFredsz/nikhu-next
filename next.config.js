/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval'
    https://www.gstatic.com
    https://www.googleapis.com
    https://www.googletagmanager.com
    https://app.midtrans.com
    https://api.midtrans.com
    https://snap.midtrans.com
    https://sandbox.midtrans.com
    https://apis.google.com;
  connect-src 'self'
    https://app.midtrans.com
    https://api.midtrans.com
    https://snap.midtrans.com
    https://sandbox.midtrans.com
    https://firestore.googleapis.com
    https://firebase.googleapis.com
    https://*.googleapis.com
    https://*.firebaseio.com
    https://*.googleusercontent.com
    https://identitytoolkit.googleapis.com
    https://securetoken.googleapis.com
    https://firebasestorage.googleapis.com
    https://storage.googleapis.com
    wss://firestore.googleapis.com
    wss://*.firebaseio.com
    wss:;
  img-src * blob: data:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  frame-src 'self'
    https://app.midtrans.com
    https://api.midtrans.com
    https://snap.midtrans.com
    https://sandbox.midtrans.com
    https://*.google.com
    https://*.firebaseapp.com;
  child-src 'self'
    https://app.midtrans.com
    https://api.midtrans.com
    https://snap.midtrans.com
    https://sandbox.midtrans.com
    https://*.google.com
    https://*.firebaseapp.com;
`.replace(/\s{2,}/g, ' ').trim()

const nextConfig = {
  // Performance & Security
  reactStrictMode: true,
  poweredByHeader: false,
  swcMinify: true,
  
  // Compiler options
  compiler: {
    removeConsole: isProd ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Image optimization - CRITICAL for PageSpeed
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },

  // Headers for caching, security, and performance
  async headers() {
    return [
      // Security headers for all routes
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), payment=()',
          },
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
      // Cache static assets aggressively - CRITICAL for PageSpeed
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache fonts
      {
        source: '/:all*(woff|woff2|ttf|otf|eot)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Webpack optimization - Reduces unused JS
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      // Enable tree shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: true,
      }

      // Better code splitting for smaller bundles
      if (!isServer) {
        config.optimization = {
          ...config.optimization,
          moduleIds: 'deterministic',
          runtimeChunk: 'single',
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              default: false,
              vendors: false,
              
              // Framework chunk (React, Next.js)
              framework: {
                name: 'framework',
                chunks: 'all',
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
                priority: 40,
                enforce: true,
              },
              
              // Firebase chunk - separate to enable better caching
              firebase: {
                test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
                name: 'firebase',
                chunks: 'async',
                priority: 35,
                reuseExistingChunk: true,
              },
              
              // Swiper chunk - lazy loaded
              swiper: {
                test: /[\\/]node_modules[\\/](swiper)[\\/]/,
                name: 'swiper',
                chunks: 'async',
                priority: 30,
                reuseExistingChunk: true,
              },
              
              // Framer Motion chunk
              framerMotion: {
                test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
                name: 'framer-motion',
                chunks: 'async',
                priority: 25,
                reuseExistingChunk: true,
              },
              
              // Other vendor libraries
              vendor: {
                name: 'vendor',
                chunks: 'all',
                test: /[\\/]node_modules[\\/]/,
                priority: 20,
                reuseExistingChunk: true,
              },
              
              // Common chunks (used by multiple pages)
              common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                priority: 10,
                reuseExistingChunk: true,
                enforce: true,
              },
            },
          },
        }
      }
    }

    return config
  },

  // Experimental features for better performance
  experimental: {
    // Optimize CSS
    optimizeCss: true,
    
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'swiper',
      'firebase',
      '@firebase/firestore',
      'react-fast-marquee',
    ],
    
    // Modern builds for modern browsers
    modern: true,
  },

  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,

  // Optimize output
  output: 'standalone',

  // Compress with gzip
  compress: true,
}

module.exports = nextConfig