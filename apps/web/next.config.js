/** @type {import('next').NextConfig} */
const nextConfig = {
  // ┌──────────────────────────────────────────────────────┐
  // │  THIS IS THE KEY CONFIG FOR MONOREPO IMPORTS         │
  // │                                                       │
  // │  transpilePackages tells Next.js:                     │
  // │  "Hey, @repo/validators lives OUTSIDE my root folder, │
  // │   but it's okay — please transpile it for me."        │
  // │                                                       │
  // │  Without this, Next.js would refuse to compile code   │
  // │  that lives outside of apps/web/.                     │
  // └──────────────────────────────────────────────────────┘
  transpilePackages: ["@repo/validators"],

  // ┌──────────────────────────────────────────────────────┐
  // │  STANDALONE OUTPUT FOR DOCKER DEPLOYMENT             │
  // │                                                       │
  // │  Creates a self-contained build output that includes  │
  // │  only the necessary files (server.js + dependencies), │
  // │  reducing the image from ~200MB to ~15MB.             │
  // └──────────────────────────────────────────────────────┘
  output: "standalone",
};

module.exports = nextConfig;
