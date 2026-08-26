const isProduction = process.env.NODE_ENV === 'production'

function asOrigin(value) {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

const externalOrigins = [
  asOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL),
  asOrigin(process.env.R2_ENDPOINT),
  asOrigin(process.env.NEXT_PUBLIC_R2_PUBLIC_URL),
].filter(Boolean)

const remotePatterns = [
  { protocol: 'http', hostname: 'localhost', port: '9000' },
  { protocol: 'http', hostname: '127.0.0.1', port: '9000' },
]

for (const origin of externalOrigins) {
  const url = new URL(origin)
  if (url.protocol === 'http:' || url.protocol === 'https:') {
    remotePatterns.push({
      protocol: url.protocol.slice(0, -1),
      hostname: url.hostname,
      port: url.port,
    })
  }
}

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: http: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${externalOrigins.join(' ')}`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  isProduction ? 'upgrade-insecure-requests' : '',
].filter(Boolean).join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          ...(isProduction
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
            : []),
        ],
      },
    ]
  },
}

export default nextConfig
