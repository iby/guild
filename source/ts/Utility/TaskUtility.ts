import {PathConfiguration} from '../Configuration/PathConfiguration';
import {Gulp} from 'gulp';
import {ReadWriteStream} from '../Stream/Pipeline';

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
     * Returns the common extension name.
     */
    static getCommonExtension(path:string|string[]):string {
        var extname = require('path').extname;
        var paths:string[] = Array.isArray(path) ? <string[]>path : [<string>path];
        var pathCount:number = paths.length;
        var extension:string = null;

        for (var i:number = 0, n:number = pathCount; i < n; i++) {

            // The last thing we want to do is to lookup the filesystem, so we first try to get the file extension from the path,
            // then do the lookup. Also, we don't do lookups if count has exceeded the original paths length – in case glob
            // matched any files that have glob patterns within their name, to avoid the endless loop. Smart through the roof…

            var pathExtension:string = extname(path = paths[i]);

            if (pathExtension !== '' && (pathExtension !== '.*' || i >= pathCount)) {
                if (extension === null) {
                    extension = pathExtension;
                } else if (extension !== pathExtension) {
                    return null;
                }
            } else if (i < pathCount) {
                paths = paths.concat(glob.sync(<string>path));
                n = paths.length;
            }
        }

        return extension === null ? extension : extension.slice(1);
    }

    /**
     * Returns the common directory basename, NOT the full directory path.
     */
    static getCommonDirectory(path:string|string[]):string {
        var dirname = require('path').dirname;
        var basename = require('path').basename;
        var paths:string[] = Array.isArray(path) ? <string[]>path : [<string>path];
        var pathCount:number = paths.length;
        var directory:string = null;

        for (var i:number = 0, n:number = pathCount; i < n; i++) {

            // Do check the relevant extension method. Here we check if the glob has magic and expand them,
            // otherwise / then do all the comparisons.

            var pathDirectory:string;

            path = paths[i];

            if (i < pathCount && glob.hasMagic(<string>path)) {
                paths = paths.concat(glob.sync(<string>path));
                n = paths.length;
            } else if ((pathDirectory = basename(dirname(path))) !== '' && pathDirectory !== '.') {
                if (directory === null) {
                    directory = pathDirectory;
                } else if (directory !== pathDirectory) {
                    return null;
                }
            }
        }

        return directory;
    }

    static getDirectory(path:string|string[]):string[] {
        var dirname = require('path').dirname;
        var paths:string[] = Array.isArray(path) ? <string[]>path : [<string>path];
        var pathCount:number = paths.length;
        var directories:string[] = [];

        for (var i:number = 0, n:number = pathCount; i < n; i++) {

            // Do check the relevant extension method. Here we check if the glob has magic and expand them,
            // otherwise / then do all the comparisons.

            var pathDirectory:string;

            path = paths[i];

            if (i < pathCount && glob.hasMagic(<string>path)) {
                paths = paths.concat(glob.sync(<string>path));
                n = paths.length;
            } else if ((pathDirectory = dirname(path = paths[i])) !== '' && pathDirectory !== '.') {
                directories.push(pathDirectory);
            }
        }

        return directories.length === 0 ? null : directories;
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
     * Normalises library path.
     */
    static normaliseLibraryPath(configuration:PathConfiguration, library?:string|string[], suffix?:string):string|string[] {
        var basePath:string|string[] = configuration.library;

        if (basePath == null) {
            throw new Error('Path configuration must contain `library` option to normalise library.')
        }

        return TaskUtility.normalisePath(basePath, library, suffix);
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
    static pipePlugins(stream:ReadWriteStream, plugins:any[]):ReadWriteStream {
        plugins.forEach(function (plugin:ReadWriteStream) {
            stream = stream == null ? plugin : stream.pipe(plugin);
        });

        return stream;
    }

    /**
     * Adds all destinations into the pipeline.
     */
    static pipeDestination(gulp:Gulp, pipeline:ReadWriteStream, destination:string|string[]):ReadWriteStream {
        (<string[]>(Array.isArray(destination) ? destination : [destination])).forEach(function (destination:string) {
            pipeline = pipeline.pipe(gulp.dest(destination));
        });

        return pipeline;
    }
}