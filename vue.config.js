// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CopyPlugin = require('copy-webpack-plugin');
const DefinePlugin = require('webpack').DefinePlugin;

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
    },
    statistics: {
      template: 'public/browser-extension.html',
      entry: './src/views/statistics.ts',
      title: 'Statistics',
      filename: 'statistics.html'
    },
    overrides: {
      template: 'public/browser-extension.html',
      entry: './src/views/override.ts',
      title: 'Config Override',
      filename: 'override.html'
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
    plugins: [new CopyPlugin({
      // Use copy plugin to copy *.wasm to output folder.
      patterns: [{ from: 'node_modules/onnxruntime-web/dist/*.wasm', to: 'wasm/[name].[ext]', noErrorOnMissing: true }]
    }),
    new DefinePlugin({
      __DEBUG__: JSON.stringify(process.env.NODE_ENV === 'development')
    })
    ]
  },
};
