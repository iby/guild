'use strict';

/**
 * @name BuildConfiguration
 * @property {LessConfiguration} less
 * @property {TwigConfiguration} twig
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
 * @name TwigConfiguration
 * @property {String} source
 * @property {String} destination
 * @property {*} data
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

var DataType = require('./Constant/DataType');
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
var twig = require('gulp-twig');

/**
 * @param {Gulp} gulp
 * @param {BuildConfiguration} configuration
 * @param {Object} parameters
 * @param {Boolean} parameters.watch
 * @param {Array} cleanTasks
 * @param {Array} buildTasks
 */
function createBuildLessTask(gulp, configuration, parameters, cleanTasks, buildTasks) {
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
function createBuildTwigTask(gulp, configuration, parameters, cleanTasks, buildTasks) {
    var twigConfiguration = configuration.twig;
    var watch = parameters.watch;
    var source = twigConfiguration.source;
    var destination = twigConfiguration.destination;
    var plugins = twigConfiguration.plugins;
    var pluginsGenerator = plugins instanceof Function ? plugins : function () { return plugins };

    buildTasks.push(Task.BUILD_TWIG);
    gulp.task(Task.BUILD_TWIG, false, function () {
        var pipeline = gulp.src(path.join(source, '**/*.twig')).pipe(plumber());
        var plugins = pluginsGenerator();
        var index;

        // Normalise plugins.

        (plugins == null || plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
        (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.TWIG);
        (index = plugins.indexOf(Plugin.TWIG)) >= 0 && plugins.splice(index, 1, twig(twigConfiguration.data));

        plugins.forEach(function (plugin) {
            pipeline = pipeline.pipe(plugin)
        });

        return pipeline.pipe(gulp.dest(destination));
    });

    // Todo: must watch for js and css products or have an option for that.

    buildClean(gulp, path.join(destination, '*'), Task.BUILD_CLEAN_TWIG, cleanTasks);
    watch && buildWatch(gulp, path.join(source, '**/*'), Task.BUILD_TWIG_WATCH, [Task.BUILD_TWIG], buildTasks);
}

/**
 * @param {Gulp} gulp
 * @param {BuildConfiguration} configuration
 * @param {Object} parameters
 * @param {Boolean} parameters.watch
 * @param {Array} cleanTasks
 * @param {Array} buildTasks
 */
function createBuildWebpackTask(gulp, configuration, parameters, cleanTasks, buildTasks) {
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
 * @param {Array} buildTasks
 */
function buildWatch(gulp, path, watchTask, runTasks, buildTasks) {
    buildTasks.push(watchTask);
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
 * @param {Array} cleanTasks
 */
function buildClean(gulp, path, cleanTask, cleanTasks) {
    cleanTasks.push(cleanTask);
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
    var validator = new SchemaValidator();

    // Inject stuff into build configuration.

    buildConfiguration.path = pathConfiguration;

    // Gulp help stuff.

    var description = 'Clean and build target (js, css) sources, when no target is given, builds for everything.';
    var options = {
        production: 'Build for production, will minify and strip everything it can. Very slow.',
        watch: 'Watch files for changes to re-run.'
    };
    var taskOptions = {
        less: 'Build less sources.',
        twig: 'Build twig sources.',
        webpack: 'Build js sources with webpack.'
    };

    // Fixme: schema allows to pass path arrays, but this will fail when we join them. This must be handled separately.

    var cleanTasks = [];
    var buildTasks = [];
    var generators = {
        less: createBuildLessTask,
        twig: createBuildTwigTask,
        webpack: createBuildWebpackTask
    };

    Object.keys(buildConfiguration).forEach(function (key) {
        var generator = generators[key];
        var schema = Schema['BUILD_' + key.toUpperCase()];

        if (generator != null && schema != null && validator.validate(buildConfiguration[key], schema, {throwError: true})) {
            generator(gulp, buildConfiguration, parameters, cleanTasks, buildTasks);
            options[key] = taskOptions[key];
        }
    });

    gulp.task(Task.BUILD, description, function (callback) {
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

module.exports = build;