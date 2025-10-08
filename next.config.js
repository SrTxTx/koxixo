/** @type {import('next').NextConfig} */
const path = require('path')

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
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/contexts': path.resolve(__dirname, 'src/contexts'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/types': path.resolve(__dirname, 'src/types'),
    }
    
    return config
  },
  
  // Configurações para resolver problemas de hidratação
  reactStrictMode: true,
  
  // Configurações para melhorar performance
  swcMinify: true,
}

module.exports = nextConfig