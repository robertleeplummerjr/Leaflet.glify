const path = require('path');

module.exports = {
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000
    },
    mode: 'production',
    externals: {
        leaflet: {
            commonjs: 'leaflet',
            commonjs2: 'leaflet',
            amd: 'leaflet',
            root: 'L', // indicates global variable
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(glsl|vs|fs|vert|frag)$/,
                exclude: /node_modules/,
                use: [
                    'ts-shader-loader'
                ]
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'glify-browser.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'umd',
    },
};
