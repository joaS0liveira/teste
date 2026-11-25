import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Addresses of earlier versions of the app.
  redirects: async () =>
    [
      ["/programa", "/"],
      ["/entidades", "/entidades-empresas"],
      ["/dados", "/qualidade"],
      ["/pessoas", "/participantes"],
      ["/pessoas/:id", "/participantes"],
    ].map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    })),
}

export default nextConfig
