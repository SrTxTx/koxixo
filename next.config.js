/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Simplificar configurações experimentais
    optimizePackageImports: ['lucide-react']
  },
  
  // Simplificar webpack config para compatibilidade
  webpack: (config, { isServer }) => {
    // Configuração mínima para resolver paths
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    
    return config
  },
  
  // Configurações básicas
  reactStrictMode: true,
  swcMinify: true,
  
  // Configurações de output para Vercel
  output: 'standalone'
}

module.exports = nextConfig

module.exports = nextConfig