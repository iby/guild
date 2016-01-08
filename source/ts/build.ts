/// <reference path="./Configuration/GuildConfiguration.ts"/>

import {BuildConfiguration, GuildConfiguration, LessConfiguration, TwigConfiguration, WebpackConfiguration} from './Configuration/GuildConfiguration';
import {DataType} from './Constant/DataType';
import {GulpHelp} from 'gulp-help';
import {Parameter} from './Constant/Parameter';
import {ParsedArgs} from 'minimist';
import {PathConfiguration} from './Configuration/PathConfiguration';
import {Plugin} from './Constant/Plugin';
import {Schema} from './Constant/Schema';
import {Stream} from 'stream';
import {TaskUtility} from './Utility/TaskUtility';
import {Task} from './Constant/Task';
import {Validator} from './Validator/Validator';

import clone = require('clone');
import del = require('del');
import less = require('gulp-less');
import path = require('path');
import postcss = require('gulp-postcss');
import sequence = require('run-sequence');
import twig = require('gulp-twig');
import webpack = require('webpack-stream');

/**
 * Creates and registers less build tasks.
 */
function createBuildLessTask(gulp:GulpHelp, configuration:BuildConfiguration, parameters:ParsedArgs, cleanTasks:string[], buildTasks:string[]):void {
    var lessConfiguration:LessConfiguration = configuration.less;
    var pathConfiguration:PathConfiguration = configuration.path;
    var watch:boolean = parameters[Parameter.WATCH] === true;
    var source:string;
    var destination:string|string[];
    var plugins:any[]|Function;
    var pluginsGenerator:Function;

    // Normalise configuration.

    if (typeof lessConfiguration === DataType.BOOLEAN) {
    } else {
        source = lessConfiguration.source;
        destination = lessConfiguration.destination;
        plugins = lessConfiguration.plugins;
    }

    source == null && (source = 'less');
    destination == null && (destination = 'css');
    plugins == null && (plugins = []);
    pluginsGenerator = plugins instanceof Function ? plugins : function () { return clone(plugins) };

    // Postcss configuration.

    var postcssConfiguration = [
        require('postcss-discard-comments')({removeAll: true}),
        require('stylelint')({
            rules: {
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

        // Normalise plugins.

        var plugins:any[] = pluginsGenerator();
        var index:number;

        (plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
        (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.LESS);
        (index = plugins.indexOf(Plugin.LESS)) >= 0 && plugins.splice(index, 1, less(), postcss(postcssConfiguration));

        var pipeline:Stream = gulp.src(TaskUtility.normaliseSourcePath(pathConfiguration, source, '**/*.less')).pipe(TaskUtility.createPlumber());
        pipeline = TaskUtility.pipePlugins(pipeline, plugins);
        pipeline = TaskUtility.pipeDestination(gulp, pipeline, TaskUtility.normaliseDestinationPath(pathConfiguration, destination));

        return pipeline;
    });

    createBuildCleanTask(gulp, TaskUtility.normaliseDestinationPath(pathConfiguration, destination, '*'), Task.BUILD_CLEAN_LESS, cleanTasks);
    watch && createBuildWatchTask(gulp, TaskUtility.normaliseSourcePath(pathConfiguration, source, '**/*.less'), Task.BUILD_LESS_WATCH, [Task.BUILD_LESS], buildTasks);
}

/**
 * Creates and registers twig build tasks.
 */
function createBuildTwigTask(gulp:GulpHelp, configuration:BuildConfiguration, parameters:ParsedArgs, cleanTasks:string[], buildTasks:string[]):void {
    var twigConfiguration:TwigConfiguration = configuration.twig;
    var pathConfiguration:PathConfiguration = configuration.path;
    var watch:boolean = parameters[Parameter.WATCH] === true;
    var source:string;
    var destination:string;
    var plugins:any[]|Function;
    var pluginsGenerator:Function;
    var data:any;

    // Normalise configuration.

    if (typeof twigConfiguration === DataType.BOOLEAN) {
    } else if (twigConfiguration.source != null || twigConfiguration.destination != null || twigConfiguration.plugins != null) {
        source = twigConfiguration.source;
        destination = twigConfiguration.destination;
        plugins = twigConfiguration.plugins;
        data = twigConfiguration.data;
    } else {
        data = twigConfiguration;
    }

    source == null && (source = 'twig');
    destination == null && (destination = 'html');
    plugins == null && (plugins = []);
    pluginsGenerator = plugins instanceof Function ? plugins : function () {
        return clone(plugins)
    };

    buildTasks.push(Task.BUILD_TWIG);
    gulp.task(Task.BUILD_TWIG, false, function () {

        // Normalise plugins.

        var plugins:any[] = pluginsGenerator();
        var index:number;

        (plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
        (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.TWIG);
        (index = plugins.indexOf(Plugin.TWIG)) >= 0 && plugins.splice(index, 1, twig(data));

        var pipeline:Stream = gulp.src(TaskUtility.normaliseSourcePath(pathConfiguration, source, '**/*.twig')).pipe(TaskUtility.createPlumber());
        pipeline = TaskUtility.pipePlugins(pipeline, plugins);
        pipeline = TaskUtility.pipeDestination(gulp, pipeline, TaskUtility.normaliseDestinationPath(pathConfiguration, destination));

        return pipeline;
    });

    // Todo: must watch for js and css products or have an option for that.

    createBuildCleanTask(gulp, TaskUtility.normaliseDestinationPath(pathConfiguration, destination, '*'), Task.BUILD_CLEAN_TWIG, cleanTasks);
    watch && createBuildWatchTask(gulp, TaskUtility.normaliseSourcePath(pathConfiguration, source, '**/*.twig'), Task.BUILD_TWIG_WATCH, [Task.BUILD_TWIG], buildTasks);
}

/**
 * Creates and registers webpack build tasks.
 */
function createBuildWebpackTask(gulp:GulpHelp, configuration:BuildConfiguration, parameters:ParsedArgs, cleanTasks:string[], buildTasks:string[]):void {
    var webpackConfiguration:WebpackConfiguration = configuration.webpack;
    var pathConfiguration:PathConfiguration = configuration.path;
    var watch:boolean = parameters[Parameter.WATCH] === true;
    var source:string;
    var destination:string;
    var plugins:any[]|Function;
    var pluginsGenerator:Function;

    // Normalise configuration.

    if (webpackConfiguration.source != null || webpackConfiguration.destination != null || webpackConfiguration.configuration != null) {
        configuration = webpackConfiguration.configuration;
        destination = webpackConfiguration.destination;
        plugins = webpackConfiguration.plugins;
        source = webpackConfiguration.source;
    } else {
        configuration = webpackConfiguration;
    }

    source == null && (source = 'js');
    destination == null && (destination = 'js');
    plugins == null && (plugins = []);
    pluginsGenerator = plugins instanceof Function ? plugins : function () {
        return clone(plugins)
    };

    buildTasks.push(Task.BUILD_WEBPACK);
    gulp.task(Task.BUILD_WEBPACK, false, function () {

        // Normalise plugins.

        var plugins:any[] = pluginsGenerator();
        var index:number;

        // Normalise plugins, todo: optimise when webpack is the only plugin with watch mode on…

        (plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
        (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.WEBPACK);
        (index = plugins.indexOf(Plugin.WEBPACK)) >= 0 && plugins.splice(index, 1, webpack(configuration));

        // Create pipeline and pipe each plugin and each destination.

        var pipeline:Stream = gulp.src(TaskUtility.normaliseSourcePath(pathConfiguration, source, '**/*.js')).pipe(TaskUtility.createPlumber());
        pipeline = TaskUtility.pipePlugins(pipeline, plugins);
        pipeline = TaskUtility.pipeDestination(gulp, pipeline, TaskUtility.normaliseDestinationPath(pathConfiguration, destination));

        return pipeline;
    });

    createBuildCleanTask(gulp, TaskUtility.normaliseDestinationPath(pathConfiguration, destination, '*'), Task.BUILD_CLEAN_WEBPACK, cleanTasks);
    watch && createBuildWatchTask(gulp, TaskUtility.normaliseSourcePath(pathConfiguration, source, '**/*.js'), Task.BUILD_WEBPACK_WATCH, [Task.BUILD_WEBPACK], buildTasks);
}

/**
 * Creates and registers a clean task.
 */
function createBuildCleanTask(gulp:GulpHelp, path:string|string[], cleanTask:string, cleanTasks:string[]):void {
    cleanTasks.push(cleanTask);
    gulp.task(cleanTask, false, function () {
        return del(path, {force: true});
    });
}

/**
 * Creates and registers a watch task.
 */
function createBuildWatchTask(gulp:GulpHelp, path:string|string[], watchTask:string, runTasks:string[], buildTasks:string[]):void {
    buildTasks.push(watchTask);
    gulp.task(watchTask, false, function () {
        return gulp.watch(path, runTasks);
    });
}

/**
 * Creates build sub-tasks.
 */
export function build(gulp:GulpHelp, configuration:GuildConfiguration, parameters:ParsedArgs):void {
    var buildConfiguration:BuildConfiguration = configuration.build;
    var pathConfiguration:PathConfiguration = configuration.path;
    var validator:Validator = new Validator();

    // Inject stuff into build configuration.

    buildConfiguration.path = pathConfiguration;

    // Gulp help stuff.

    var description:string = 'Clean and build target (js, css) sources, when no target is given, builds for everything.';
    var options:any = {
        production: 'Build for production, will minify and strip everything it can. Very slow… \uD83D\uDC22',
        watch: 'Watch files for changes to re-run.'
    };
    var taskOptions:any = {
        less: 'Build less sources.',
        twig: 'Build twig sources.',
        webpack: 'Build js sources with webpack.'
    };

    // Fixme: schema allows to pass path arrays, but this will fail when we join them. This must be handled separately.

    var cleanTasks:string[] = [];
    var buildTasks:string[] = [];
    var generators:any = {
        less: createBuildLessTask,
        twig: createBuildTwigTask,
        webpack: createBuildWebpackTask
    };

    Object.keys(buildConfiguration).forEach(function (key) {
        var generator:Function = generators[key];
        var schema:string = (<any>Schema)['BUILD_' + key.toUpperCase()];

        if (generator != null && schema != null && validator.validate(buildConfiguration[key], schema, {throwError: true})) {
            generator(gulp, buildConfiguration, parameters, cleanTasks, buildTasks);
            options[key] = taskOptions[key];
        }
    });

    gulp.task(Task.BUILD, description, function (callback) {
        var tasks:any[] = [];

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