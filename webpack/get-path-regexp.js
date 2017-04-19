'use strict';

const path = require('path');

function getPathRegexp() {
    const str = path.join.apply(path, arguments);

    return new RegExp(str.replace(/\\/g, '\\\\'));
}

module.exports = getPathRegexp;