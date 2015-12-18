'use strict';

var glob = require('glob');
var path = require('path');
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
    },

    /**
     * @param {Path} configuration
     * @param {String} group
     * @param {Array|String} [target]
     * @param {String} [suffix]
     * @returns {Array|String}
     */
    normalisePath: function (configuration, group, target, suffix) {
        if (target == null) {
            target = '';
        }

        var array = Array.isArray(target);
        var targets = array ? target : [target];
        var extension;

        for (var i = 0, n = targets.length; i < n; i++) {

            // Join target path with the group path if target path path is not absolute.

            if (!path.isAbsolute(target = targets[i]) && TaskUtility.doesPathConfigurationExist(configuration, group)) {
                target = path.join(configuration[group], target);
            }

            // Suffix gets appended only when we're dealing with folders and it doesn't already end with suffix. The
            // folder-part is checked only using the extension logic, which might actually be a problem. Todo: perhaps
            // todo: there should be an additional fs check, and then if the folder doesn't exist – do this shit.

            if (suffix != null && (extension = path.extname(target)) === '' && target.slice(-suffix.length) !== suffix) {
                target = path.join(target, suffix);
            }

            targets[i] = target;
        }

        // Try to return a single path if only a single item was supplied.

        return array || targets.length > 1 ? targets : targets[0];
    },

    /**
     * @param {Path} configuration
     * @param {Array|String} [source]
     * @param {String} [suffix]
     * @returns {Array|String}
     */
    normaliseSourcePath: function (configuration, source, suffix) {
        return TaskUtility.normalisePath(configuration, 'source', source, suffix);
    },

    /**
     * @param {Path} configuration
     * @param {Array|String} [destination]
     * @param {String} [suffix]
     * @returns {Array|String}
     */
    normaliseDestinationPath: function (configuration, destination, suffix) {
        return TaskUtility.normalisePath(configuration, 'product', destination, suffix);
    }
};

module.exports = TaskUtility;