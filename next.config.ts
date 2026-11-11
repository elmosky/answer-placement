import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Finish a page's metadata before writing <head>, for every visitor. Next streams it
  // by default and blocks only for certain bots, so a cached page differed depending on
  // who triggered its rebuild, and each difference is a billed ISR write.
  htmlLimitedBots: /.*/,
  /* config options here */
};

export default nextConfig;
