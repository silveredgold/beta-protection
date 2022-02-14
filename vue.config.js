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
      }
    },
  },
  configureWebpack: {
    devtool: process.env.NODE_ENV === 'development' ? 'cheap-source-map' : 'source-map',
    plugins: [
      // new BundleAnalyzerPlugin()
    ]
  },
};
