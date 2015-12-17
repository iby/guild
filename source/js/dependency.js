'use strict';

/**
 * @name DependencyConfiguration
 * @property {*} clean
 * @property {*} normalise
 * @property {Path} path
 */

var DataType = require('./Constant/DataType');
var Plugin = require('./Constant/Plugin');
var Schema = require('./Constant/Schema');
var SchemaValidator = require('./Validator/SchemaValidator');
var Task = require('./Constant/Task');

var concat = require('gulp-concat');
var del = require('del');
var fs = require('fs');
var glob = require('glob');
var gulpif = require('gulp-if');
var less = require('gulp-less');
var merge = require('merge-stream');
var path = require('path');
var plumber = require('gulp-plumber');
var postcss = require('gulp-postcss');
var sequence = require('run-sequence');
var uglify = require('gulp-uglify');
var util = require('gulp-util');
var webpack = require('webpack-stream');

/**
 * @param {Path} configuration
 * @param {String} path
 * @param {Boolean} [throwError]
 */
function doesPathConfigurationExist(configuration, path, throwError) {
    if (configuration == null || configuration[path] == null) {
        if (throwError !== false) {
            throw new Error('`path.' + path + '` must be configured to use simple target form.')
        }
        return false;
    }

    return true;
}

/**
 * @param {String|Array} path
 * @returns {String}
 */
function getGlobExtension(path) {
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

/**
 * @param {Gulp} gulp
 * @param {DependencyConfiguration} configuration
 * @param {Object} parameters
 * @param {Array} buildTasks
 */
function dependencyNormalise(gulp, configuration, parameters, buildTasks) {

    /**
     * @name NormaliseTarget
     * @property {String} source
     * @property {String} destination
     * @property {Array} plugins
     */

    var normaliseConfiguration = configuration.normalise;
    var pathConfiguration = configuration.path;

    buildTasks.push(Task.DEPENDENCY_NORMALISE);
    gulp.task(Task.DEPENDENCY_NORMALISE, false, function () {
        var streams = [];

        Object.keys(normaliseConfiguration).forEach(function (key) {

            /** @type {NormaliseTarget} */
            var target = normaliseConfiguration[key];
            var source;
            var destination;
            var plugins;
            var index;
            var pipeline;
            var basename;
            var extension;
            var filename;

            if (typeof target === DataType.STRING) {
                source = target;
            } else {
                source = target.source;
                destination = target.destination;
                plugins = target.plugins;
            }

            // If we didn't get destination we shall use standard library path. Also make sure we
            // make a proper filename for our final dependency.

            if (!path.isAbsolute(source) && doesPathConfigurationExist(pathConfiguration, 'dependency')) {
                source = path.join(pathConfiguration.dependency, source);
            }

            if (destination == null && doesPathConfigurationExist(pathConfiguration, 'library')) {
                destination = (extension = getGlobExtension(source)) == null ? pathConfiguration.library : path.join(pathConfiguration.library, extension);
                basename = null;
            } else {
                basename = path.basename(destination);
            }

            // Use basename as our filename if it has an extension, otherwise try figuring it out
            // from source. If that didn't work, simply use key.

            if (path.extname(key) === '' && basename != null && (extension = path.extname(basename)) !== '') {
                filename = basename;
            } else if (path.extname(key) === '' && (extension = path.extname(source)) !== '') {
                filename = key + extension;
            } else {
                filename = key;
            }

            // Normalise plugins.

            (plugins == null || plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
            (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.NORMALISE);
            (index = plugins.indexOf(Plugin.NORMALISE)) >= 0 && plugins.splice(index, 1,

                //// Uglify if dealing with js files.
                gulpif(/.*\.js/, uglify()),

                // Just in case concat everything and output as a single file at a single
                // location, event if there's only one file, we still want to rename it.
                concat(filename)
            );

            pipeline = gulp.src(source).pipe(plumber());

            plugins.forEach(function (plugin) {
                pipeline = pipeline.pipe(plugin);
            });

            streams.push(pipeline.pipe(gulp.dest(destination)));
        });

        return merge(streams);
    });
}

/**
 * @param {Gulp} gulp
 * @param {DependencyConfiguration} configuration
 * @param {Object} parameters
 * @param {Array} cleanTasks
 */
function dependencyClean(gulp, configuration, parameters, cleanTasks) {
    var cleanConfiguration = configuration.clean;
    var pathConfiguration = configuration.path;
    var target = cleanConfiguration;

    if (target === false) {
        return;
    } else if (target === true && doesPathConfigurationExist(pathConfiguration, 'library')) {
        target = path.join(pathConfiguration.library, '*');
    }

    if (target == null) {
        throw new Error('No target configured.');
    }

    cleanTasks.push(Task.DEPENDENCY_CLEAN);
    gulp.task(Task.DEPENDENCY_CLEAN, function (callback) {
        return del(target, {force: true}, callback);
    });
}

/**
 * @param {Gulp} gulp
 * @param {GuildConfiguration} configuration
 * @param {Object} parameters
 */
function normalise(gulp, configuration, parameters) {
    var dependencyConfiguration = configuration.dependency;
    var pathConfiguration = configuration.path;
    var clean = dependencyConfiguration.clean != null;
    var normalise = dependencyConfiguration.normalise != null;
    var validator = new SchemaValidator();

    // Inject stuff into dependency configuration.

    dependencyConfiguration.path = pathConfiguration;

    // Gulp help stuff.

    var description = 'Clean and build dependencies into local libraries.';
    var options = {
        production: 'Build for production, will minify and strip everything it can. Very slow.',
        watch: 'Watch files for changes to re-run.'
    };

    var cleanTasks = [];
    var buildTasks = [];

    // Clean

    if (clean && validator.validate(dependencyConfiguration.clean, Schema.DEPENDENCY_CLEAN, {throwError: true})) {
        dependencyClean(gulp, dependencyConfiguration, parameters, cleanTasks);
        options.clean = 'Clean dependencies.';
    }

    // Normalise

    if (normalise && validator.validate(dependencyConfiguration.normalise, Schema.DEPENDENCY_NORMALISE, {throwError: true})) {
        dependencyNormalise(gulp, dependencyConfiguration, parameters, buildTasks);
        options.normalise = 'Normalise dependencies.';
    }

    gulp.task(Task.DEPENDENCY, description, function (callback) {
        var tasks = [];
        cleanTasks.length > 0 && tasks.push(cleanTasks);
        buildTasks.length > 0 && tasks.push.apply(tasks, buildTasks);

        if (tasks.length === 0) {
            throw new Error('No tasks were configured, make sure your configuration is correct.');
        } else {
            tasks.push(callback);
        }

        return sequence.use(gulp).apply(null, tasks);
    }, {options: options});
}

module.exports = normalise;