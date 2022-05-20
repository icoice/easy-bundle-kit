const { CleanWebpackPlugin } = require('clean-webpack-plugin');


module.exports = {
  mode: 'development',
  entry: 'F:\\Codes\\easy-bundle-kit\\examples',
  output: {
    filename: 'bundle.js',
    path: 'F:\\Codes\\easy-bundle-kit\\examples\\dist'
  },
  plugins: [new CleanWebpackPlugin()],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /dist|node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-typescript'
            ],
            plugins: []
          }
        }
      }
    ]
  }
};
    