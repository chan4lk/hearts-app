/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  webpack: (config, { isServer, webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
    };
    
    // Handle node: protocol imports - must be first
    config.plugins = config.plugins || [];
    config.plugins.unshift(
      new webpack.NormalModuleReplacementPlugin(
        /^node:/,
        (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        }
      )
    );
    
    // Custom plugin to handle node: protocol at resolve stage (before webpack processes it)
    config.plugins.unshift({
      apply: (compiler) => {
        compiler.hooks.normalModuleFactory.tap('NodeProtocolPlugin', (nmf) => {
          nmf.hooks.beforeResolve.tap('NodeProtocolPlugin', (data) => {
            if (data && data.request && typeof data.request === 'string' && data.request.startsWith('node:')) {
              data.request = data.request.replace(/^node:/, '');
            }
          });
        });
      },
    });
    
    // For non-server builds (client + middleware), ignore applicationinsights completely
    if (!isServer) {
      // Ignore applicationinsights and Azure packages
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(applicationinsights|@azure\/monitor-opentelemetry|@azure\/monitor-opentelemetry-exporter|@azure\/functions-core)$/,
        })
      );
      
      // Externalize Node.js built-in modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        util: false,
        buffer: false,
        events: false,
      };
    }
    
    // Mark optional Azure packages as externals for server builds
    // @azure/functions-core is optionally required by @azure/monitor-opentelemetry
    // and is only needed in Azure Functions environments
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@azure/functions-core');
    }

    // Improve chunk loading
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    };
    
    return config;
  },
  output: 'standalone',
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  async rewrites() {
    return [
      {
        source: '/login',
        destination: '/login',
      },
    ];
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_DOMAIN: process.env.NEXTAUTH_DOMAIN,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  }
}

module.exports = nextConfig 