'use strict';
let postcss = require('postcss');

module.exports = postcss.plugin('postcss-all-important', allImportant);

function allImportant(options) {
    return function(root) {
        root.walkRules(function(rule) {
            if (rule.parent.type === 'atrule' && rule.parent.name !== 'media') {
                return rule;
            }
            
            rule.each(function(child) {
                if (child.type === 'decl') {
                    child.important = true;
                }
            });
        });
    };
}

