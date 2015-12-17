'use strict';

/**
 * @name BuildConfiguration
 * @property {LessConfiguration} less
 * @property {WebpackConfiguration} webpack
 * @property {Path} path
 */

/**
 * @name LessConfiguration
 * @property {String} source
 * @property {String} destination
 * @property {Array} plugins
 * @property {Path} path
 */

/**
 * @name WebpackConfiguration
 * @property {String} source
 * @property {String} destination
 * @property {Object} configuration
 * @property {Array} plugins
 * @property {Path} path
 */

var Plugin = require('./Constant/Plugin');
var Schema = require('./Constant/Schema');
var SchemaValidator = require('./Validator/SchemaValidator');
var Task = require('./Constant/Task');

var del = require('del');
var less = require('gulp-less');
var path = require('path');
var plumber = require('gulp-plumber');
var postcss = require('gulp-postcss');
var sequence = require('run-sequence');
var util = require('gulp-util');
var webpack = require('webpack-stream');

/**
 * @param {Gulp} gulp
 * @param {BuildConfiguration} configuration
 * @param {Object} parameters
 * @param {Boolean} parameters.watch
 * @param {Array} cleanTasks
 * @param {Array} buildTasks
 */
function buildLess(gulp, configuration, parameters, cleanTasks, buildTasks) {
    var lessConfiguration = configuration.less;
    var watch = parameters.watch;
    var source = lessConfiguration.source;
    var destination = lessConfiguration.destination;
    var plugins = lessConfiguration.plugins;
    var pluginsGenerator = plugins instanceof Function ? plugins : function () { return plugins };

    // Postcss configuration.

    var postcssConfiguration = [
        require('postcss-discard-comments')({removeAll: true}),
        require('stylelint')({
            "rules": {
                "property-no-vendor-prefix": true,
                "selector-no-vendor-prefix": true,
                "value-no-vendor-prefix": true
            }
        }),
        require('autoprefixer')({browsers: ['last 2 versions']}),
        require('cssnano')(),
        require('postcss-reporter')()
    ];

    buildTasks.push(Task.BUILD_LESS);
    gulp.task(Task.BUILD_LESS, false, function () {
        var pipeline = gulp.src(path.join(source, '**/*.less')).pipe(plumber());
        var plugins = pluginsGenerator();
        var index;

        // Normalise plugins.

        (plugins == null || plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
        (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.LESS);
        (index = plugins.indexOf(Plugin.LESS)) >= 0 && plugins.splice(index, 1, less(), postcss(postcssConfiguration));

        // Todo: is it ok that we don't use this anymore? Keep an eye on this for awhile.

        // .on('error', function (error) {
        //     util.log(error);
        //     this.emit('end');
        // })

        plugins.forEach(function (plugin) {
            pipeline = pipeline.pipe(plugin)
        });

        return pipeline.pipe(gulp.dest(destination));
    });

    buildClean(gulp, path.join(destination, '*'), Task.BUILD_CLEAN_LESS, cleanTasks);
    watch && buildWatch(gulp, path.join(source, '**/*'), Task.BUILD_LESS_WATCH, [Task.BUILD_LESS], buildTasks);
}

/**
 * @param {Gulp} gulp
 * @param {BuildConfiguration} configuration
 * @param {Object} parameters
 * @param {Boolean} parameters.watch
 * @param {Array} cleanTasks
 * @param {Array} buildTasks
 */
function buildWebpack(gulp, configuration, parameters, cleanTasks, buildTasks) {
    var webpackConfiguration = configuration.webpack;
    var watch = parameters.watch;
    var source = webpackConfiguration.source;
    var destination = webpackConfiguration.destination;
    var plugins = webpackConfiguration.plugins;
    var pluginsGenerator = plugins instanceof Function ? plugins : function () { return plugins };

    buildTasks.push(Task.BUILD_WEBPACK);
    gulp.task(Task.BUILD_WEBPACK, function () {
        var pipeline = gulp.src(path.join(source, '**/*.js')).pipe(plumber());
        var plugins = pluginsGenerator();
        var index;

        // Normalise plugins, todo: optimise when webpack is the only plugin with watch mode on…

        (plugins == null || plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
        (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.WEBPACK);
        (index = plugins.indexOf(Plugin.WEBPACK)) >= 0 && plugins.splice(index, 1, webpack(webpackConfiguration.configuration));

        plugins.forEach(function (plugin) {
            pipeline = pipeline.pipe(plugin)
        });

        return pipeline.pipe(gulp.dest(destination));
    });

    buildClean(gulp, path.join(destination, '*'), Task.BUILD_CLEAN_WEBPACK, cleanTasks);
    watch && buildWatch(gulp, path.join(source, '**/*'), Task.BUILD_WEBPACK_WATCH, [Task.BUILD_WEBPACK], buildTasks);
}

/**
 * Creates and registers a watch task.
 *
 * @param {Gulp} gulp
 * @param {String} path
 * @param {String} watchTask
 * @param {Array} runTasks
 * @param {Array} registeredTasks
 */
function buildWatch(gulp, path, watchTask, runTasks, registeredTasks) {
    registeredTasks.push(watchTask);
    gulp.task(watchTask, false, function () {
        return gulp.watch(path, runTasks);
    });
}

/**
 * Creates and registers a clean task.
 *
 * @param {Gulp} gulp
 * @param {String} path
 * @param {String} cleanTask
 * @param {Array} registeredTasks
 */
function buildClean(gulp, path, cleanTask, registeredTasks) {
    registeredTasks.push(cleanTask);
    gulp.task(cleanTask, false, function (callback) {
        return del(path, {force: true}, callback);
    });
}

/**
 * @param {Gulp} gulp
 * @param {GuildConfiguration} configuration
 * @param {Object} parameters
 */
function build(gulp, configuration, parameters) {
    var buildConfiguration = configuration.build;
    var pathConfiguration = configuration.path;
    var includeLess = buildConfiguration.less != null;
    var includeWebpack = buildConfiguration.webpack != null;
    var validator = new SchemaValidator();

    // Inject stuff into dependency configuration.

    buildConfiguration.path = pathConfiguration;

    // Gulp help stuff.

    var description = 'Clean and build target (js, css) sources, when no target is given, builds for everything.';
    var options = {
        production: 'Build for production, will minify and strip everything it can. Very slow.',
        watch: 'Watch files for changes to re-run.'
    };

    var cleanTasks = [];
    var buildTasks = [];

    // Fixme: schema allows to pass path arrays, but this will fail when we join them. This must be handled separately.

    // Less…

    if (includeLess && validator.validate(buildConfiguration.less, Schema.BUILD_LESS, {throwError: true})) {
        buildLess(gulp, buildConfiguration, parameters, cleanTasks, buildTasks);
        options.less = 'Build less sources.';
    }

    // Webpack…

    if (includeWebpack && validator.validate(buildConfiguration.webpack, Schema.BUILD_WEBPACK, {throwError: true})) {
        buildWebpack(gulp, buildConfiguration, parameters, cleanTasks, buildTasks);
        options.webpack = 'Build js sources with webpack.';
    }

    gulp.task(Task.BUILD, description, function (callback) {
        return sequence.use(gulp).apply(null, [cleanTasks].concat(buildTasks, [callback]));
    }, {options: options});
}

module.exports = build;