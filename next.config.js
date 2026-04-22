/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Next.js 16: `images.domains` is removed in favor of `remotePatterns`
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  // Next.js 16 defaults to Turbopack; we keep custom webpack plugins
  // (IgnorePlugin, NormalModuleReplacement, chunk splitting). An empty
  // `turbopack` key silences the "webpack config without turbopack config"
  // error while still letting the `webpack` key below take effect.
  turbopack: {},
  // Turbopack can't resolve `read-excel-file` from node_modules directly
  // (its package.json exports field confuses the resolver). Forcing it
  // through Next's transpile pipeline fixes the resolution.
  transpilePackages: ['read-excel-file'],
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
    
    // Suppress @azure/functions-core warning (optional peer dep that's never used in Next.js)
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /^@azure\/functions-core$/ })
    );

    // Silence noisy "Critical dependency" warnings from applicationinsights /
    // OpenTelemetry instrumentation packages (they use dynamic require() on purpose).
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules[\\/]@opentelemetry[\\/]instrumentation/ },
      { module: /node_modules[\\/]@azure[\\/]opentelemetry-instrumentation-azure-sdk/ },
      { module: /node_modules[\\/]require-in-the-middle/ },
      { message: /Critical dependency: the request of a dependency is an expression/ },
      { message: /Critical dependency: require function is used in a way/ },
    ];

    // For non-server builds (client + middleware), ignore applicationinsights completely
    if (!isServer) {
      // Ignore applicationinsights and Azure packages
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(applicationinsights|@azure\/monitor-opentelemetry|@azure\/monitor-opentelemetry-exporter)$/,
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
  // Next.js 15+: don't bundle these — require() them at runtime on the
  // server. applicationinsights transitively depends on optional DB
  // adapters (mysql, mongodb, …) via diagnostic-channel-publishers that
  // the bundler can't resolve statically.
  serverExternalPackages: [
    'applicationinsights',
    '@azure/monitor-opentelemetry',
    '@azure/monitor-opentelemetry-exporter',
    'diagnostic-channel',
    'diagnostic-channel-publishers',
  ],
  // Next.js 16 removed the top-level `eslint` config key; lint is now handled
  // by `next lint` separately. We intentionally don't block builds on lint.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
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
  }
}

module.exports = nextConfig 