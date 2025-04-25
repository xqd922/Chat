import withBundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from 'next'

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  transpilePackages: ['geist'],
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    // inlineCss: true,
    reactCompiler: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    remotePatterns: [
      {
        hostname: 'vercel.com',
      },
    ],
  },
}

export default bundleAnalyzer(nextConfig)
