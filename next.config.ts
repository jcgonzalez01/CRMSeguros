import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.join(__dirname),
  },
  // Lets the dev server serve HMR/fonts to browsers on the LAN, not just
  // localhost — needed since the app is accessed via 192.168.1.26 here.
  allowedDevOrigins: ["192.168.1.26"],
};

export default nextConfig;
