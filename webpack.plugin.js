const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const OUTPUT_PATH = (process.env.OUTPUT_PATH && path.resolve(process.env.OUTPUT_PATH)) || path.join(__dirname, 'dist/build');
const NODE_ENV = process.env.NODE_ENV || 'production';
const ASSET_PATH = process.env.ASSET_PATH || '/';

const DEV_TOOL = NODE_ENV == "production" ? "source-map" : "inline-source-map";

const webpack = require('webpack');

require('dotenv').config();

module.exports = {
    mode: NODE_ENV,
    devtool: DEV_TOOL,
    entry: './src/index.js',
    output: {
        filename: 'ai-model-plugin.js',
        path: OUTPUT_PATH,
        publicPath: ASSET_PATH,
        libraryTarget: 'umd',
        library: 'ai-model-plugin'
    },
    devServer: {
        port: 3001,
        contentBase: OUTPUT_PATH,
        writeToDisk: true,
        injectClient: false,
        historyApiFallback: true,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": true
        },
        clientLogLevel: 'debug'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                use: "babel-loader",
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: 'assets/icons/[name].[ext]',
                            outputPath: ASSET_PATH
                        },
                    },
                ],
            },
            {
                test: /\.(ttf|otf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?|(jpg|gif)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                        }
                    }
                ]
            }
        ]
    },
    externals: {
        'react': 'react',
        'react-dom': 'react-dom',
        'redux': 'redux',
        'react-redux': 'react-redux',
        '@penta-b/grid': '@penta-b/grid',
        '@penta-b/ma-lib': '@penta-b/ma-lib'
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(process.env)
        }),
        process.env.NODE_ENV !== 'production' &&
        new CopyPlugin({
            patterns: [
                {
                    from: 'test-data',
                    to: 'test-data'
                }
            ]
        })
    ].filter(Boolean)
};