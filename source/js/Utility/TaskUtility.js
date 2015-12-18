'use strict';

var glob = require('glob');
var plumber = require('gulp-plumber');
var util = require('gulp-util');

/**
 * @param {Error} error
 */
function plumberErrorHandler(error) {
    util.beep();
    util.log(error);
}

var TaskUtility = {

    /**
     * @returns {Stream}
     */
    createPlumber: function () {
        return plumber({errorHandler: plumberErrorHandler})
    },

    /**
     * @param {Path} configuration
     * @param {String} path
     * @param {Boolean} [throwError]
     */
    doesPathConfigurationExist: function (configuration, path, throwError) {
        if (configuration == null || configuration[path] == null) {
            if (throwError !== false) {
                throw new Error('`path.' + path + '` must be configured to use simple target form.')
            }
            return false;
        }

        return true;
    },

    /**
     * @param {String|Array} path
     * @returns {String}
     */
    getGlobExtension: function (path) {
        var extension = null;
        var paths = [];

        paths = paths.concat(glob.sync(path));

        for (var i = 0, n = paths.length; i < n; i++) {
            var pathExtension = require('path').extname(path = paths[i]);

            if (pathExtension === '') {
                continue;
            } else if (extension === null) {
                extension = pathExtension;
            } else if (extension !== pathExtension) {
                return null;
            }
        }

        return extension === null ? extension : extension.slice(1);
    }
};

module.exports = TaskUtility;