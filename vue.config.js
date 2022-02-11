// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  pages: {
    popup: {
      template: 'public/browser-extension.html',
      entry: './src/popup/main.ts',
      title: 'Popup',
    },
    options: {
      template: 'public/browser-extension.html',
      entry: './src/options/main.ts',
      title: 'Options',
    },
    store: {
      template: 'public/browser-extension.html',
      entry: './src/placeholders/main.ts',
      title: 'Placeholder Store',
      filename: 'store.html'
    }
  },
  pluginOptions: {
    browserExtension: {
      components: {
        contentScripts: true
      },
      componentOptions: {
        background: {
          entry: 'src/background.ts',
        },
        contentScripts: {
          entries: {
            'content-script': 'src/content-scripts/content-script.ts'
          },
        },
      },
      manifestTransformer: (manifest) => {
        // if (process.env.NODE_ENV === 'development') {
        //   manifest.content_security_policy = manifest.content_security_policy.replace('script-src', 'script-src http://localhost:8098');
        // }
        
        
        return manifest;
      }
    },
  },
  configureWebpack: {
    devtool: process.env.NODE_ENV === 'development' ? 'cheap-module-eval-source-map' : 'source-map',
    plugins: [
      // new BundleAnalyzerPlugin()
    ]
  },
};
