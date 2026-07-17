import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-Powered-By', value: '' },
];

if (process.env.NODE_ENV === 'production') {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  });
}

const nextConfig: NextConfig = {
  // Cho phép truy cập dev server từ các origin này (LAN + ngrok).
  // Thêm host ngrok của bạn vào đây; hỗ trợ cả wildcard cho subdomain ngrok.
  allowedDevOrigins: [
    "192.168.0.102",
    "192.168.4.98",
    "127.0.0.1",
    "localhost",
    "extenuate-postal-online.ngrok-free.dev",
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.io",
  ],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
