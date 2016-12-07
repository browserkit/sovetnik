'use strict';
let WrapperPlugin = require('wrapper-webpack-plugin');
let PathChunkPlugin = require('path-chunk-webpack-plugin');
let path = require('path');
let fs = require('fs-extra');

let scopify = require('./../postcss/postcss-scopify');
let autoprefixer = require('autoprefixer');
let allImportant = require('./../postcss/postcss-all-important');
let initial = require('postcss-initial');

function getExtensionConfig(settings, type) {
    'use strict';

    let headers = {};
    let footers = {};
    const withPopup = fs.existsSync('./split-code/extension/button-extension/popup/popup.js');

    let entry = {
        'sovetnik/injectors/sovetnik-inject-background.max': './split-code/extension/button-extension/background/index.js',
        'sovetnik/injectors/sovetnik-inject-content.max': './split-code/extension/button-extension/content-scripts/index.js'
    };

    if (withPopup) {
        entry['sovetnik/popup/sovetnik-popup.max'] = './split-code/extension/button-extension/popup/popup.js';
        entry['sovetnik/popup/sovetnik-popup-style'] = './split-code/extension/button-extension/popup/style.js';
        settings.withButton = true;
    }
    
    if (type === 'firefox-webextension') {
        settings.statsDisabled = true;
    }

    let output = {
        path: `./`,
        filename: '[name].js',
        jsonpFunction: 'loadSovetnikInjectorModule'
    };

    headers['sovetnik-inject-background.max.js'] = '(function(SOVETNIK_SETTINGS) {\n';
    footers['sovetnik-inject-background.max.js'] = '})(' + JSON.stringify(settings, 2, 2) + '\n);';

    headers['sovetnik-inject-content.max.js'] = '(function() {\n if (window.svt) { return;} window.svt = {};\n';
    footers['sovetnik-inject-content.max.js'] = '})();';


    let config = {
        entry: entry,
        output: output,
        'if-loader': type,
        module: {
            loaders: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
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
                    loader: 'style!css-loader'
                },
                {
                    test: /\.css$/,
                    include: /split\-code\/src\/view\/components/,
                    loader: 'style!css-loader!postcss-loader'
                },
                {test: /\.mustache/, loader: 'mustache'},
                {test: /\.(png|svg)$/, loader: 'url'}
            ]
        },
        plugins: [],
        postcss() {
            return [
                scopify('div#sovetnik.sovetnik'),
                initial({reset: 'all'}),
                autoprefixer,
                allImportant
            ];
        }
    };

    if (withPopup) {
        config.plugins.push(new PathChunkPlugin({
            name: 'sovetnik/popup/sovetnik-popup-templates',
            test(path) {
                return /\.mustache$/.test(path);
            }
        }));
    }

    config.plugins.push(
        new WrapperPlugin({
            header(fileName) {
                fileName = path.basename(fileName);
                return headers[fileName] || '';
            },

            footer(fileName) {
                fileName = path.basename(fileName);
                return footers[fileName] || '';
            }
        })
    );

    config.plugins.push(
        new PathChunkPlugin({
            name: 'sovetnik/sovetnik-vendor',
            test(path) {
                const loaders = ['css-loader', 'style-loader'];

                if (/node_modules[\/\\]/.test(path)) {
                    return !loaders.some((name) => path.indexOf(`node_modules/${name}`) !== -1);
                }
                return false;
            }
        })
    );

    return config;
}

module.exports = getExtensionConfig;
