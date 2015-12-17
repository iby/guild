'use strict';

var path = require('path');

/**
 * @constructor
 * @param {String} root
 * @returns {{dependency, documentation, entrypoint, library, product, source}}
 */
function Path(root) {
    return {
        dependency: path.join(root, 'dependency'),
        documentation: path.join(root, 'documentation'),
        entrypoint: path.join(root, 'entrypoint'),
        library: path.join(root, 'library'),
        product: path.join(root, 'product'),
        source: path.join(root, 'source')
    };
}

module.exports = Path;