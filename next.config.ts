import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fija la raíz del workspace a esta carpeta (hay otro lockfile en el home).
  turbopack: {
    root: path.join(__dirname),
  },
  // El driver de MongoDB es solo de servidor; no lo empaquetes en el cliente.
  serverExternalPackages: ["mongodb"],
};

export default nextConfig;
