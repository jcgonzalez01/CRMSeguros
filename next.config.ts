import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.join(__dirname),
  },
  // Lets the dev server serve HMR/fonts to browsers on the LAN, not just
  // localhost — the sandbox's LAN/VPN IP has changed before across
  // restarts, so both are allowlisted.
  allowedDevOrigins: ["192.168.1.26", "100.123.107.9"],
};

export default nextConfig;
