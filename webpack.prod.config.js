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
        test: /\.inline.css$/,
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
        test: /\.css$/,
        exclude: /\.inline.css$/,
        use: extractCss
      },
      { test: /\.inline.js$/, use: 'raw-loader' },
      { test: /\.(json|mp3|wav|eot|woff2|woff|ttf|svg)$/, use: 'file-loader' }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './src/index.html'),
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
