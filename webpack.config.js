const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        index: './src/index.js',
    },
    output: {
        filename: 'BlinkReceiptJS.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'BlinkReceiptJS',
        libraryTarget: 'umd',
    },
    experiments: {
        topLevelAwait: true,
    },
    resolve: {
        extensions: ['.wasm', '.js', '.mjs'],
        alias: {
            './encryption': path.resolve(__dirname, './encryption.mjs'),
        }
    },
    module: {
        rules: [
            {
                test: /\.mjs$/,
                include: /node_modules/,
                type: "javascript/auto",
            },
            {
                test: /\.wasm$/,
                type: 'asset/resource',
            },
        ],
    },
};
