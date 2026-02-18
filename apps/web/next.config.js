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
};

module.exports = nextConfig;
