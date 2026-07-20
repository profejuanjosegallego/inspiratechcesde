import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fija la raíz del workspace a esta carpeta (hay otro lockfile en el home).
  turbopack: {
    root: path.join(__dirname),
  },
  // El driver de MongoDB es solo de servidor; no lo empaquetes en el cliente.
  serverExternalPackages: ["mongodb"],
  // Protección contra "version skew" GRATIS (sin Skew Protection de pago):
  // usamos el hash del commit (que Vercel expone en VERCEL_GIT_COMMIT_SHA) como
  // id de despliegue. Así, si el navegador tiene assets viejos tras un deploy,
  // Next detecta el desfase y RECARGA la página sola en vez de quedarse colgada.
  deploymentId: process.env.VERCEL_GIT_COMMIT_SHA,
};

export default nextConfig;
