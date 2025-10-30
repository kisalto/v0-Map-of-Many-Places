/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-scripts.com https://gc.kes.v2.scr.kaspersky-labs.com;
      script-src-elem 'self' 'unsafe-inline' https://vercel.live https://*.vercel-scripts.com https://gc.kes.v2.scr.kaspersky-labs.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https://*.supabase.co https://blob.vercel-storage.com https://*.blob.vercel-storage.com https://blobs.vusercontent.net;
      font-src 'self' data:;
      connect-src 'self' https://v0.dev https://v0.app https://v0chat.vercel.sh
        https://v0docs.vercel.sh https://v0-marketing.vercel.sh https://vercel.live
        https://vercel.com https://*.pusher.com https://blob.vercel-storage.com
        https://*.blob.vercel-storage.com https://blobs.vusercontent.net
        wss://*.pusher.com https://fides-vercel.us.fides.ethyca.com/api/v1/
        https://cdn-api.ethyca.com/location https://privacy-vercel.us.fides.ethyca.com/api/v1/
        https://*.sentry.io/api/ https://huggingface.co/onnx-community/
        https://cas-bridge.xethub.hf.co/xet-bridge-us/ https://cdn.jsdelivr.net/npm/@huggingface/
        *.cr-relay.com https://api.v0.app https://*.supabase.co wss://*.supabase.co;
      worker-src 'self' blob:;
      frame-src 'self' https://vercel.live;
    `.replace(/\s{2,}/g, ' ').trim(),
  },
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
