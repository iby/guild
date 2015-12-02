'use strict';

var del = require('del');
var jsonschema = require('jsonschema');
var less = require('gulp-less');
var path = require('path');
var plumber = require('gulp-plumber');
var postcss = require('gulp-postcss');
var sequence = require('run-sequence');
var util = require('gulp-util');
var webpack = require('webpack-stream');

// Constants.

var TASK_BUILD_CLEAN_LESS = 'build-clean-less';
var TASK_BUILD_LESS = 'build-less';
var TASK_BUILD_LESS_WATCH = 'build-less-watch';
var TASK_BUILD_CLEAN_WEBPACK = 'build-clean-webpack';
var TASK_BUILD_WEBPACK = 'build-webpack';
var TASK_BUILD_WEBPACK_WATCH = 'build-webpack-watch';

function build(gulp, configuration, parameters) {
    var includeLess = configuration.less != null;
    var includeWebpack = configuration.webpack != null;
    var watch = parameters.watch;

    // Configure json schema validator.

    var validator = new jsonschema.Validator();

    validator.addSchema(require('./Schema/PathSchema.json'));
    validator.addSchema(require('./Schema/BuildLessSchema.json'));
    validator.addSchema(require('./Schema/BuildWebpackSchema.json'));

    //

    var taskDescription = 'Clean and build target (js, css) sources, when no target is given, builds for everything.';
    var taskOptions = {
        production: 'Build for production, will minify and strip everything it can. Very slow.',
        watch: 'Watch files for changes to re-run.'
    };

    var cleanTasks = [];
    var buildTasks = [];

    //

    var task;
    var source;
    var destination;

    // Fixme: schema allows to pass path arrays, but this will fail when we join them. This must be handled separately.

    // Less

    if (includeLess && validator.validate(configuration.less, '/Build/Less', {throwError: true})) {
        source = configuration.less['source'];
        destination = configuration.less['destination'];
        taskOptions.less = 'Build less sources.';

        cleanTasks.push(task = TASK_BUILD_CLEAN_LESS);
        gulp.task(task, false, function (callback) {
            return del(path.join(destination, '*'), {force: true}, callback);
        });

        buildTasks.push(task = TASK_BUILD_LESS);
        gulp.task(task, false, function () {
            return gulp.src(path.join(source, '**/*.less'))
                .pipe(plumber())
                .pipe(less())
                .on('error', function (error) {
                    util.log(error);
                    this.emit('end');
                })
                .pipe(postcss([
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
                ]))
                .pipe(gulp.dest(path.join(destination)));
        });

        watch && buildTasks.push(task = TASK_BUILD_LESS_WATCH);
        watch && gulp.task(task, false, function () {
            return gulp.watch(path.join(source, '**/*'), [TASK_BUILD_LESS]);
        });
    }

    // Webpack

    if (includeWebpack && validator.validate(configuration.webpack, '/Build/Webpack', {throwError: true})) {
        var webpackConfiguration = configuration.webpack['configuration'];
        source = configuration.webpack['source'];
        destination = configuration.webpack['destination'];
        taskOptions.webpack = 'Build js sources with webpack.';

        cleanTasks.push(task = TASK_BUILD_CLEAN_WEBPACK);
        gulp.task(task, false, function (callback) {
            return del(path.join(configuration.path.entrypoint, 'js/*'), {force: true}, callback);
        });

        buildTasks.push(task = TASK_BUILD_WEBPACK);
        gulp.task(task, function () {
            return gulp.src(source)
                .pipe(webpack(webpackConfiguration))
                .pipe(gulp.dest(destination));
        });

        watch && buildTasks.push(task = TASK_BUILD_WEBPACK_WATCH);
        watch && gulp.task(task, false, function () {
            return gulp.watch(path.join(source, '**/*'), [TASK_BUILD_WEBPACK]);
        });
    }

    gulp.task('build', taskDescription, function (callback) {
        return sequence.use(gulp).apply(null, [cleanTasks].concat(buildTasks, [callback]));
    }, {options: taskOptions});
}

module.exports = build;