'use strict';
let WrapperPlugin = require('wrapper-webpack-plugin');
let path = require('path');

function getExtensionConfig(settings) {
    'use strict';

    let headers = {};
    let footers = {};

    let entry = {
        'firefox-inject-sovetnik': './split-code/extension/ff-amo/index.js'
    };
    
    let output = {
        path: `./sovetnik/chrome/content`,
        filename: '[name].js'
    };

    headers['firefox-inject-sovetnik.js'] = '(function(SOVETNIK_SETTINGS, SCRIPT_URL) {\n';
    footers['firefox-inject-sovetnik.js'] = '})(' + JSON.stringify(settings, 2, 2) + ', ' + '' +
        '\'chrome://sovetnik/content/package/sovetnik.min.js\'' + '\n);';

    let config = {
        entry: entry,
        output: output,
        'if-loader': 'xul',
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
                    loader: 'style!css-loader'
                }
            ]
        },
        plugins: []
    };

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

    return config;
}

module.exports = getExtensionConfig;
