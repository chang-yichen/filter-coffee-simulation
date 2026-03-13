import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/filter-coffee-simulation",
  images: { unoptimized: true },
};

export default nextConfig;
