import {DataType} from './Constant/DataType';
import {DependencyConfiguration, GuildConfiguration, NormaliseConfiguration} from './Configuration/GuildConfiguration';
import {GulpHelp} from 'gulp-help';
import {ParsedArgs} from 'minimist';
import {PathConfiguration} from './Configuration/PathConfiguration';
import {Plugin} from './Constant/Plugin';
import {Schema} from './Constant/Schema';
import {TaskUtility} from './Utility/TaskUtility';
import {Task} from './Constant/Task';
import {Validator} from './Validator/Validator';
import {Readable} from 'stream';

import concat = require('gulp-concat');
import del = require('del');
import gulpif = require('gulp-if');
import merge = require('merge-stream');
import path = require('path');
import sequence = require('run-sequence');
import uglify = require('gulp-uglify');

function createDependencyNormaliseTask(gulp:GulpHelp, configuration:DependencyConfiguration, parameters:ParsedArgs, cleanTasks:string[], dependencyTasks:string[]) {
    var normaliseConfiguration = configuration.normalise;
    var pathConfiguration = configuration.path;

    dependencyTasks.push(Task.DEPENDENCY_NORMALISE);
    gulp.task(Task.DEPENDENCY_NORMALISE, false, function () {
        var streams:Readable[] = [];

        Object.keys(normaliseConfiguration).forEach(function (key) {
            var target:NormaliseConfiguration = normaliseConfiguration[key];
            var source:string;
            var destination:string;
            var plugins:any[];
            var index:number;
            var pipeline:any;
            var basename:string;
            var extension:string;
            var filename:string;

            if (typeof target === DataType.STRING) {
                source = <string>target;
            } else {
                source = target.source;
                destination = target.destination;
                plugins = <any[]>target.plugins;
            }

            // If we didn't get destination we shall use standard library path. Also make sure we
            // make a proper filename for our final dependency.

            source = <string>TaskUtility.normalisePath(pathConfiguration, 'dependency', source);

            if (destination == null && TaskUtility.doesPathConfigurationExist(pathConfiguration, 'library')) {
                destination = (extension = TaskUtility.getGlobExtension(source)) == null ? pathConfiguration.library : path.join(pathConfiguration.library, extension);
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

            pipeline = gulp.src(source).pipe(TaskUtility.createPlumber());

            plugins.forEach(function (plugin) {
                pipeline = pipeline.pipe(plugin);
            });

            streams.push(pipeline.pipe(gulp.dest(destination)));
        });

        return merge.apply(null, streams);
    });
}

function createDependencyCleanTask(gulp:GulpHelp, configuration:DependencyConfiguration, parameters:ParsedArgs, cleanTasks:string[], dependencyTasks:string[]) {

    // fixme…

    var cleanConfiguration:any = configuration.clean;
    var pathConfiguration:PathConfiguration = configuration.path;
    var target:boolean|any = cleanConfiguration;

    if (target === false) {
        return;
    } else if (target === true && TaskUtility.doesPathConfigurationExist(pathConfiguration, 'library')) {
        target = path.join(pathConfiguration.library, '*');
    }

    if (target == null) {
        throw new Error('No target configured.');
    }

    // Todo: removed callback from here… watch if it breaks anything.

    cleanTasks.push(Task.DEPENDENCY_CLEAN);
    gulp.task(Task.DEPENDENCY_CLEAN, function () {
        return del(target, {force: true});
    });
}

/**
 * @param {GulpHelp} gulp
 * @param {GuildConfiguration} configuration
 * @param {Object} parameters
 */
export function dependency(gulp:GulpHelp, configuration:GuildConfiguration, parameters:ParsedArgs) {
    var dependencyConfiguration:DependencyConfiguration = configuration.dependency;
    var pathConfiguration:PathConfiguration = configuration.path;
    var clean:boolean = dependencyConfiguration.clean != null;
    var normalise:boolean = dependencyConfiguration.normalise != null;
    var validator:Validator = new Validator();

    // Inject stuff into dependency configuration.

    dependencyConfiguration.path = pathConfiguration;

    // Gulp help stuff.

    var description:string = 'Clean and build dependencies into local libraries.';
    var options:any = {
        production: 'Build for production, will minify and strip everything it can. Very slow.',
        watch: 'Watch files for changes to re-run.'
    };
    var taskOptions:any = {
        clean: 'Clean dependencies.',
        normalise: 'Normalise dependencies.'
    };

    var cleanTasks:string[] = [];
    var dependencyTasks:string[] = [];
    var generators:any = {
        clean: createDependencyCleanTask,
        normalise: createDependencyNormaliseTask
    };

    Object.keys(dependencyConfiguration).forEach(function (key) {
        var generator:Function = generators[key];
        var schema:string = (<any>Schema)['DEPENDENCY_' + key.toUpperCase()];

        if (generator != null && schema != null && validator.validate(dependencyConfiguration[key], schema, {throwError: true})) {
            generator(gulp, dependencyConfiguration, parameters, cleanTasks, dependencyTasks);
            options[key] = taskOptions[key];
        }
    });

    gulp.task(Task.DEPENDENCY, description, function (callback) {
        var tasks:any[] = [];

        cleanTasks.length > 0 && tasks.push(cleanTasks);
        dependencyTasks.length > 0 && tasks.push.apply(tasks, dependencyTasks);

        if (tasks.length === 0) {
            throw new Error('No tasks were configured, make sure your configuration is correct.');
        } else {
            tasks.push(callback);
        }

        return sequence.use(gulp).apply(null, tasks);
    }, {options: options});
}