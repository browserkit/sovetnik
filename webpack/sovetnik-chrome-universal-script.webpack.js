'use strict';

//it's only for moderators

let webpack = require('webpack');
let PathChunkPlugin = require('path-chunk-webpack-plugin');
let WrapperPlugin = require('wrapper-webpack-plugin');

let scopify = require('./../postcss/postcss-scopify');
let autoprefixer = require('autoprefixer');
let allImportant = require('./../postcss/postcss-all-important');
let initial = require('postcss-initial');
let getPathRegexp = require('./get-path-regexp');
let path = require('path');

let header = 'function startSovetnik(settingsJSON) {\n';
let footer = '\n}';

module.exports = {
    entry: {
        'ecomerce-context': './split-code/src/main.js'
    },

    output: {
        path: './sovetnik/script',
        filename: '[name].js',
        jsonpFunction: 'loadSovetnikModule'
    },
    module: {
        loaders: [
            {
                test: /\.js$/, exclude: /node_modules/,
                loaders: [
                    'stripcomment?-block',
                    'babel'
                ]
            },
            {test: /\.json/, loader: 'json'},
            {
                test: /\.css$/,
                exclude: getPathRegexp('split-code', 'src', 'view', 'components'),
                loader: 'to-string!css'
            },
            {
                test: /\.css$/,
                include: getPathRegexp('split-code', 'src', 'view', 'components'),
                loader: 'css-loader!postcss-loader'
            },
            {test: /\.mustache/, loader: 'mustache'}
        ]
    },
    plugins: [
        new WrapperPlugin({
            header(filename) {
                return filename === 'ecomerce-context.js' ? header : '';
            },

            footer(filename) {
                return filename === 'ecomerce-context.js' ? footer : '';
            }
        }),
        
        new PathChunkPlugin({
            name: 'sovetnik-templates',
            test(path) {
                return /\.mustache$/.test(path);
            }
        }),

        new PathChunkPlugin({
            name: 'sovetnik-vendor',
            test(pathOfFile) {
                const loaders = ['css-loader', 'style-loader'];

                if (getPathRegexp('node_modules', path.sep).test(pathOfFile)) {
                    return !loaders.some((name) => pathOfFile.indexOf(path.join('node_modules', name)) !== -1);
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