import {PathConfiguration} from '../Configuration/PathConfiguration';
import {Stream} from 'stream';
import {GulpHelp} from 'gulp-help';

import clone = require('clone');
import glob = require('glob');
import path = require('path');
import plumber = require('gulp-plumber');
import util = require('gulp-util');

import pathModule = path;

/**
 * Handles plumber errors.
 */
function plumberErrorHandler(error:any) {
    util.beep();
    util.log(error);
}

export class TaskUtility {

    /**
     * Creates gulp plumber stream with pre-configured error handler.
     */
    static createPlumber():any {
        return plumber({errorHandler: plumberErrorHandler});
    }

    /**
     * Checks if a given path configuration exists, like `product` or `library`. Comes handy when need
     * working with relative paths.
     */
    static doesPathConfigurationExist(configuration:PathConfiguration, path:string, throwError?:boolean):boolean {
        if (configuration == null || configuration[path] == null) {
            if (throwError !== false) {
                throw new Error('`path.' + path + '` must be configured to use simple target form.')
            }
            return false;
        }

        return true;
    }

    /**
     *
     */
    static getGlobExtension(path:string):string {
        var extension:string = null;
        var paths:Array<string> = [];

        paths = paths.concat(glob.sync(path));

        for (var i:number = 0, n:number = paths.length; i < n; i++) {
            var pathExtension:string = require('path').extname(path = paths[i]);

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
     * Normalises the given path in relation to the base path and appends the suffix. Normalisation involves
     * checking if the path is absolute and, if not, appending it to the base path.
     */
    static normalisePath(basePath:string|string[], path?:string|string[], suffix?:string):string|string[] {
        path == null && (path = '');

        var basePathArray:boolean = Array.isArray(basePath);
        var pathArray:boolean = Array.isArray(path);
        var normalisedPaths:string[] = [];
        var extension:string;

        (<string[]>(basePathArray ? basePath : [basePath])).forEach(function (basePath:string) {
            (<string[]>(pathArray ? path : [path])).forEach(function (path:string) {

                // Join target path with the group path if target path path is not absolute.

                if (!pathModule.isAbsolute(path)) {
                    path = pathModule.join(basePath, path);
                }

                // Suffix gets appended only when we're dealing with folders and it doesn't already end with suffix. The
                // folder-part is checked only using the extension logic, which might actually be a problem. Todo: perhaps
                // todo: there should be an additional fs check, and then if the folder doesn't exist – do this shit.

                if (suffix != null && (extension = pathModule.extname(path)) === '' && path.slice(-suffix.length) !== suffix) {
                    path = pathModule.join(path, suffix);
                }

                normalisedPaths.push(path);
            });
        });

        // Try to return a single path if only a single item was supplied.

        return basePathArray || pathArray ? normalisedPaths : normalisedPaths[0];
    }

    /**
     * Normalises dependency path.
     */
    static normaliseDependencyPath(configuration:PathConfiguration, dependency?:string|string[]):string|string[] {
        var basePath:string|string[] = configuration.dependency;

        if (basePath == null) {
            throw new Error('Path configuration must contain `dependency` option to normalise dependency.')
        }

        return TaskUtility.normalisePath(basePath, dependency);
    }

    /**
     * Normalises destination path.
     */
    static normaliseDestinationPath(configuration:PathConfiguration, destination?:string|string[], suffix?:string):string|string[] {
        var basePath:string|string[] = configuration.destination == null ? configuration.product : configuration.destination;

        if (basePath == null) {
            throw new Error('Path configuration must contain `destination` or `product` option to normalise destination.')
        }

        return TaskUtility.normalisePath(basePath, destination, suffix);
    }

    /**
     * Normalises source path.
     */
    static normaliseSourcePath(configuration:PathConfiguration, source?:string|string[], suffix?:string):string|string[] {
        var basePath:string = configuration.source;

        if (basePath == null) {
            throw new Error('Path configuration must contain `source` option to normalise source.')
        }

        return TaskUtility.normalisePath(basePath, source, suffix);
    }

    /**
     * Normalises product path.
     */
    static normaliseProductPath(configuration:PathConfiguration, product?:string|string[], suffix?:string):string|string[] {
        var basePath:string = configuration.product;

        if (basePath == null) {
            throw new Error('Path configuration must contain `product` option to normalise product.')
        }

        return TaskUtility.normalisePath(basePath, product, suffix);
    }

    /**
     * Adds all plugins into the pipeline.
     */
    static pipePlugins(pipeline:Stream, plugins:any[]):Stream {
        plugins.forEach(function (plugin) {
            pipeline = pipeline.pipe(plugin);
        });

        return pipeline;
    }

    /**
     * Adds all destinations into the pipeline.
     */
    static pipeDestination(gulp:GulpHelp, pipeline:Stream, destination:string|string[]):Stream {
        (<string[]>(Array.isArray(destination) ? destination : [destination])).forEach(function (destination:string) {
            pipeline = pipeline.pipe(gulp.dest(destination));
        });

        return pipeline;
    }
}