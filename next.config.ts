import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Real estate listing sites
      {
        protocol: "https",
        hostname: "*.housingcdn.com",
      },
      {
        protocol: "https",
        hostname: "*.housing.com",
      },
      {
        protocol: "https",
        hostname: "*.magicbricks.com",
      },
      {
        protocol: "https",
        hostname: "*.99acres.com",
      },
      {
        protocol: "https",
        hostname: "*.nobroker.in",
      },
      {
        protocol: "https",
        hostname: "*.nobroker.com",
      },
      {
        protocol: "https",
        hostname: "*.makaan.com",
      },
      {
        protocol: "https",
        hostname: "*.commonfloor.com",
      },
      {
        protocol: "https",
        hostname: "*.quikr.com",
      },
      {
        protocol: "https",
        hostname: "*.makemytrip.com",
      },
      {
        protocol: "https",
        hostname: "*.keysorrent.com",
      },
      // Allow any subdomain for property images
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
