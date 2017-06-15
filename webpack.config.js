const webpack = require('webpack');
const path = require('path');
const HtmlwebpackPlugin = require('html-webpack-plugin');
const config = require('config');

module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: './app/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  devServer: {
    hot: true,
    inline: true,
    progress: true,
    historyApiFallback: true,
    host: '0.0.0.0',
    port: 5001,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
      },
      API_HOST: JSON.stringify(`http://localhost:${config.port}`),
    }),
    new webpack.HotModuleReplacementPlugin(),
    new HtmlwebpackPlugin({
      title: 'EchoML',
      favicon: './app/public/favicon.ico',
      template: './app/public/index.ejs',
    }),
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/,
      }, {
        test: /\.css$/,
        loader: 'style!css',
      }, {
        test: /\.woff2?(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&minetype=application/font-woff',
      }, {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&minetype=application/octet-stream',
      }, {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file',
      }, {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&minetype=image/svg+xml',
      },
    ],
  },
};
