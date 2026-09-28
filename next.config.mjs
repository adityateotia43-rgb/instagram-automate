/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/webhooks/instagram",
        destination: "/api/webhooks/instagram",
      },
    ];
  },
};

export default nextConfig;
