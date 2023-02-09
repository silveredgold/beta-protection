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
    },
    local: {
      template: 'public/browser-extension.html',
      entry: './src/views/censorFiles.ts',
      title: 'Censor Local Files',
      filename: 'local.html'
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
            'content-script': 'src/content-scripts/content-script.ts',
            'connector': 'src/connector/main.ts'
          },
        },
      }
    },
  },
  configureWebpack: {
    devtool: process.env.NODE_ENV === 'development' ? 'cheap-source-map' : 'source-map',
    resolve: {
      alias: {
        "#": '@silveredgold/beta-shared'
      }
    },
    module: {
      rules: [
        {
          test: /\.mjs$/,
          include: /beta-components/,
          type: 'javascript/auto'
        }
      ]
    },
    plugins: [new CopyPlugin({
      // Use copy plugin to copy *.wasm to output folder.
      patterns: [{ from: 'node_modules/onnxruntime-web/dist/*.wasm', to: 'wasm/[name].[ext]', noErrorOnMissing: true },
      {
        from: 'node_modules/webextension-polyfill/dist/browser-polyfill.js',
      }]
    }),
    new DefinePlugin({
      __DEBUG__: JSON.stringify(process.env.NODE_ENV === 'development'),
      __REPO_URL__: JSON.stringify('https://github.com/silveredgold/beta-protection/')
    })
    ]
  },
};
