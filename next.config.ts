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
  //
  // OJO: el SHA completo tiene 40 caracteres y Vercel RECHAZA el despliegue si
  // `deploymentId` pasa de 32 ("must be 32 characters or less"). Lo recortamos:
  // 12 hex ya identifican el commit sin ambigüedad (es el short SHA de git).
  deploymentId: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12),
};

export default nextConfig;
