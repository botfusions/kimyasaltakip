/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    // Allow images from Supabase storage and localhost
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
    // Optimize images for production
    formats: ["image/avif", "image/webp"],
  },

  // Enable experimental features for Netlify compatibility
  experimental: {
    // Server Actions are stable in Next.js 14
    serverComponentsExternalPackages: ["pg"],
  },

  // Ignore TypeScript errors during build (handled by CI)
  // Remove this when all errors are fixed
  // typescript: {
  //   ignoreBuildErrors: false,
  // },

  // Lint is handled by CI pipeline separately
  // This prevents minor lint warnings from blocking builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optimize production bundles
  compiler: {
    // Remove console.log in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  // Security headers (also defined in netlify.toml for redundancy)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
