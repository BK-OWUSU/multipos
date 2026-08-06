
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   allowedDevOrigins: [
    'safely-collected-reflex.ngrok-free.dev',
    '*.ngrok-free.dev' // Optional: Allows any future ngrok URLs you generate
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.ufs.sh',
      },
    ],
  },
};

export default nextConfig;
