const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const autoprefixer = require('autoprefixer')

const postCss = {
  loader: 'postcss-loader',
  options: {
    plugins: () => [
      autoprefixer('> 1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9')
    ]
  }
}

module.exports = {
  entry: path.resolve(__dirname, './src/index.ts'),
  output: {
    filename: 'bundle.js',
    chunkFilename: '[id].bundle.js'
  },
  resolve: {
    extensions: ['.ts', '.js', '.css']
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader' },
      {
        test: /\.css$/,
        oneOf: [
          {
            resourceQuery: /inline/,
            use: [
              {
                loader: 'css-loader',
                options: {
                  importLoaders: 1
                }
              },
              postCss
            ]
          },
          {
            use: [
              { loader: 'style-loader' },
              {
                loader: 'css-loader',
                options: {
                  importLoaders: 1,
                  modules: true,
                  namedExport: true,
                  localIdentName: '[local]_[hash:base64:5]'
                }
              },
              postCss
            ]
          }
        ]
      },
      {
        test: /\.js$/,
        oneOf: [
          {
            resourceQuery: /inline/,
            use: 'raw-loader'
          }
        ]
      },
      {
        test: /\.json$/,
        oneOf: [
          {
            resourceQuery: /uncached/,
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: '[name].[ext]'
                }
              }
            ]
          },
          {
            use: 'file-loader'
          }
        ]
      },
      {
        test: /\.png$/,
        oneOf: [
          {
            resourceQuery: /uncached/,
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: '[name].[ext]'
                }
              }
            ]
          },
          {
            use: 'file-loader'
          }
        ]
      },
      { test: /\.(mp3|wav|webm|ogg)$/, use: 'file-loader' },
      { test: /\.(eot|woff2|woff|ttf|svg)$/, use: 'file-loader' }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './src/index.html'),
      favicon: path.resolve(__dirname, './src/favicon.ico')
    }),
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: "'development'" }
    }),
    new webpack.WatchIgnorePlugin([/css\.d\.ts$/])
  ],
  devtool: 'cheap-eval-source-map',
  devServer: {
    contentBase: path.resolve(__dirname, './src'),
    inline: true,
    host: '0.0.0.0',
    disableHostCheck: true
  },
  performance: {
    hints: false
  }
}
