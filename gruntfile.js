const fs = require('fs-extra');

module.exports = function (grunt) {
    const banner = grunt.file.read('banner');

    const type = grunt.option('type') || 'chrome';

    const settings = {
        applicationName: "Яндекс.Советник",
        affId: 1008,
        clid: 2210590,
        sovetnikExtension: true
    };
    const settingsDistribution = {
        applicationName: "Советник Яндекс.Маркета",
        affId: 1048,
        clid: 2210393,
        sovetnikExtension: true
    };

    grunt.initConfig({
        uglify: {
            sovetnik: {
                options: {
                    banner: banner,
                    mangle: {
                        except: ['mbr']
                    },
                    mangleProperties: true,
                    mangleRegex: /^_/
                },
                files: {
                    'sovetnik.min.js': ['sovetnik.max.js']
                }
            },
            ecommerce: {
                options: {
                    banner: banner,
                    mangle: {
                        except: ['mbr']
                    },
                    mangleProperties: true,
                    mangleRegex: /^_/
                },
                files: {
                    'sovetnik.min.js': ['ecomerce-context.js']
                }
            },
            'xul-split': {
                options: {
                    banner: banner,
                    mangle: {
                        except: ['mbr']
                    },
                    mangleProperties: true,
                    mangleRegex: /^_/
                },
                files: {
                    'sovetnik/chrome/content/package/sovetnik.min.js': 
                        ['sovetnik/chrome/content/package/ecomerce-context.js']
                }
            },
            'extension': {
                options: {
                    mangle: {
                        except: ['mbr', 'svt']
                    },
                    mangleProperties: true,
                    mangleRegex: /^_/
                },
                files: {
                    'sovetnik-inject-background.min.js': ['sovetnik-inject-background.js'],
                    'sovetnik-inject-content.min.js': ['sovetnik-inject-content.js']
                }
            },
            'sovetnik-internal': {
                options: {
                    banner: banner,
                    mangle: {
                        except: ['mbr', 'svt']
                    },
                    mangleProperties: true,
                    mangleRegex: /^_/
                },
                files: {
                    'sovetnik-internal.min.js': ['sovetnik-internal.js']
                }
            },
            'web-extension': {
                options: {
                    mangle: {
                        except: ['mbr', 'svt']
                    },
                    mangleProperties: true,
                    mangleRegex: /^_/
                },
                files: {
                    'sovetnik/injectors/sovetnik-inject-background.min.js': [
                        'sovetnik/injectors/sovetnik-inject-background.max.js'
                    ],
                    'sovetnik/injectors/sovetnik-inject-content.min.js': [
                        'sovetnik/injectors/sovetnik-inject-content.max.js'
                    ],
                    'sovetnik/popup/sovetnik-popup.min.js': [
                        'sovetnik/popup/sovetnik-popup.max.js'
                    ]
                }
            },
            'web-extension-script': {
                options: {
                    banner: banner,
                    mangle: {
                        except: ['mbr', 'svt']
                    },
                    mangleProperties: true,
                    mangleRegex: /^_/
                },
                files: {
                    'sovetnik/script/sovetnik-internal.min.js': [
                        'sovetnik/script/ecomerce-context.js'
                    ]
                }
            }
        },
        webpack: {
            'split': require('./webpack/firefox-xul-split.webpack.js'),
            'xul-injector': require('./webpack/firefox-xul-injector.webpack')(settings),
            'web-extension-script': require('./webpack/sovetnik-chrome-universal-script.webpack.js'),
            'web-extension': require('./webpack/sovetnik-extension.webpack')(settings, type),
            'web-extension-distribution': require('./webpack/sovetnik-extension.webpack')(settingsDistribution, type)
        }
    });

    grunt.registerTask('remove-unused-files', () => {
         [
             'sovetnik/injectors/sovetnik-inject-background.max.js',
             'sovetnik/injectors/sovetnik-inject-content.max.js',
             'sovetnik/popup/sovetnik-popup.max.js',
             'sovetnik/script/ecomerce-context.js',
             'sovetnik/chrome/content/package/ecomerce-context.js'
         ].forEach((filename) => {
             try {
                 fs.removeSync(filename);
             } catch(ex) {
                 console.log(ex);
             }
         });
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-webpack');

    grunt.registerTask('default', ['uglify:sovetnik']);
    grunt.registerTask('extension', ['uglify:extension', 'uglify:sovetnik-internal']);
    grunt.registerTask('xul', [
        'webpack:split', 
        'uglify:xul-split', 
        'webpack:xul-injector',
        'remove-unused-files'
    ]);
    
    grunt.registerTask('web-extension', [
        'webpack:web-extension-script', 
        'webpack:web-extension',
        'uglify:web-extension-script',
        'uglify:web-extension',
        'remove-unused-files'
    ]);
    
    grunt.registerTask('web-extension-distribution', [
        'webpack:web-extension-script', 
        'webpack:web-extension-distribution',
        'uglify:web-extension-script',
        'uglify:web-extension',
        'remove-unused-files'
    ]);
};
