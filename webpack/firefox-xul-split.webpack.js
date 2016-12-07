'use strict';

//it's only for moderators

let webpack = require('webpack');
let PathChunkPlugin = require('path-chunk-webpack-plugin');

let scopify = require('./../postcss/postcss-scopify');
let autoprefixer = require('autoprefixer');
let allImportant = require('./../postcss/postcss-all-important');
let initial = require('postcss-initial');

module.exports = {
    entry: {
        'ecomerce-context': './split-code/src/main.js'
    },
    
    'if-loader': 'mpn-split',

    output: {
        path: './sovetnik/chrome/content/package',
        filename: '[name].js',
        jsonpFunction: 'loadSovetnikModule'
    },
    module: {
        loaders: [
            {
                test: /\.js$/, exclude: /node_modules/,
                loaders: [
                    'stripcomment?-block',
                    'babel',
                    'if'
                ]
            },
            {test: /\.json/, loader: 'json'},
            {
                test: /\.css$/,
                exclude: /split\-code\/src\/view\/components/,
                loader: 'to-string!css'
            },
            {
                test: /\.css$/,
                include: /split\-code\/src\/view\/components/,
                loader: 'style!css-loader!postcss-loader'
            },
            {test: /\.mustache/, loader: 'mustache'}
        ]
    },
    plugins: [
        new PathChunkPlugin({
            name: 'sovetnik-templates',
            test(path) {
                return /\.mustache$/.test(path);
            }
        }),

        new PathChunkPlugin({
            name: 'sovetnik-vendor',
            test(path) {
                const loaders = ['css-loader', 'style-loader'];

                if (/node_modules[\/\\]/.test(path)) {
                    return !loaders.some((name) => path.indexOf(`node_modules/${name}`) !== -1);
                }
                return false;
            }
        })
    ],
    postcss() {
        return [
            scopify('div#sovetnik.sovetnik'),
            initial({reset: 'all'}),
            autoprefixer,
            allImportant
        ];
    }
};