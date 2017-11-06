const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const autoprefixer = require('autoprefixer')

const postCss = {
  loader: 'postcss-loader',
  options: {
    plugins: () => [
      autoprefixer('> 1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9')
    ]
  }
}

const extractCss = ExtractTextPlugin.extract({
  fallback: 'style-loader',
  use: [
    {
      loader: 'css-loader',
      options: {
        importLoaders: 1,
        modules: true,
        localIdentName: '[local]_[hash:base64:5]'
      }
    },
    postCss
  ]
})

module.exports = {
  entry: path.resolve(__dirname, './src/index.ts'),
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[hash].js',
    chunkFilename: '[chunkhash].js'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      { test: /\.ts$/, use: 'ts-loader' },
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
            use: extractCss
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
              },
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
      favicon: path.resolve(__dirname, './src/favicon.ico'),
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true
      }
    }),
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: "'production'" }
    }),
    new ExtractTextPlugin('[hash].css'),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        drop_console: true
      },
      comments: false,
      sourceMap: false
    }),
    new webpack.optimize.OccurrenceOrderPlugin(true),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    })
  ]
}
