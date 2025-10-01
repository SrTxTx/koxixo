/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações para resolver problemas de cache
  experimental: {
    optimizePackageImports: ['next-auth', 'lucide-react']
  },
  
  // Configurações do webpack para resolver problemas de módulos
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Limpa cache do webpack em desenvolvimento
      config.cache = false
    }
    
    // Configurações para resolver problemas de importação
    config.resolve.alias = {
      ...config.resolve.alias,
    }
    
    return config
  },
  
  // Configurações para resolver problemas de hidratação
  reactStrictMode: true,
  
  // Configurações para melhorar performance
  swcMinify: true,
}

module.exports = nextConfig