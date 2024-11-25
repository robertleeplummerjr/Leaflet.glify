const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './example.ts',
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.html?$/,
                use: 'raw-loader',
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
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'index.html', to: 'index.html' },
                // build/css so it aligns with the parcel script
                { from: 'node_modules/leaflet/dist/leaflet.css', to: 'build/css/leaflet.css' },
                { from: 'data/**', to: '' },
            ],
        }),
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.html'],
    },
    output: {
        filename: 'glify-browser.js',
        path: path.resolve(__dirname, '.gh-pages'),
        libraryTarget: 'umd',
    },
};
