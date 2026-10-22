import type { NextConfig } from "next";

// cacheComponents est désactivé : tout le site est derrière une connexion,
// chaque page dépend de l'utilisateur et change en temps réel.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
