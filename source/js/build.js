'use strict';

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
 *
 */
function buildLess(gulp, configuration, parameters, cleanTasks, buildTasks) {
    var watch = parameters.watch;
    var source = configuration['source'];
    var destination = configuration['destination'];
    var plugins = configuration['plugins'];
    var index;

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

    // Normalise plugins.

    (plugins == null || plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
    (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.LESS);
    (index = plugins.indexOf(Plugin.LESS)) >= 0 && plugins.splice(index, 1, less(), postcss(postcssConfiguration));

    buildTasks.push(Task.BUILD_LESS);
    gulp.task(Task.BUILD_LESS, false, function () {
        var pipeline = gulp.src(path.join(source, '**/*.less')).pipe(plumber());

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
 *
 */
function buildWebpack(gulp, configuration, parameters, cleanTasks, buildTasks) {
    var watch = parameters.watch;
    var webpackConfiguration = configuration['configuration'];
    var source = configuration['source'];
    var destination = configuration['destination'];
    var plugins = configuration['plugins'];
    var index;

    // Normalise plugins.

    (plugins == null || plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
    (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.WEBPACK);
    (index = plugins.indexOf(Plugin.WEBPACK)) >= 0 && plugins.splice(index, 1, webpack(webpackConfiguration));

    buildTasks.push(Task.BUILD_WEBPACK);
    gulp.task(Task.BUILD_WEBPACK, function () {
        var pipeline = gulp.src(path.join(source, '**/*.js')).pipe(plumber());

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
 * @param gulp
 * @param path
 * @param watchTask
 * @param runTasks
 * @param registeredTasks
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
 * @param gulp
 * @param path
 * @param cleanTask
 * @param registeredTasks
 */
function buildClean(gulp, path, cleanTask, registeredTasks) {
    registeredTasks.push(cleanTask);
    gulp.task(cleanTask, false, function (callback) {
        return del(path, {force: true}, callback);
    });
}

//

function build(gulp, configuration, parameters) {
    var includeLess = configuration.less != null;
    var includeWebpack = configuration.webpack != null;
    var validator = new SchemaValidator();

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

    if (includeLess && validator.validate(configuration.less, Schema.BUILD_LESS, {throwError: true})) {
        buildLess(gulp, configuration.less, parameters, cleanTasks, buildTasks);
        options.less = 'Build less sources.';
    }

    // Webpack…

    if (includeWebpack && validator.validate(configuration.webpack, Schema.BUILD_WEBPACK, {throwError: true})) {
        buildWebpack(gulp, configuration.webpack, parameters, cleanTasks, buildTasks);
        options.webpack = 'Build js sources with webpack.';
    }

    gulp.task('build', description, function (callback) {
        return sequence.use(gulp).apply(null, [cleanTasks].concat(buildTasks, [callback]));
    }, {options: options});
}

module.exports = build;