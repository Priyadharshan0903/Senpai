import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // libsql ships native bindings — must stay external to the bundler
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
