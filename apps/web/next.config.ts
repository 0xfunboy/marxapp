import type { NextConfig } from "next";

const apiTarget = process.env.API_PROXY_TARGET || "http://127.0.0.1:4100";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${apiTarget}/:path*`
      }
    ];
  }
};

export default nextConfig;
