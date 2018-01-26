import {PathConfiguration} from '../Configuration/PathConfiguration';

import fs = require('fs');
import glob = require('glob');
import path = require('path');

import pathBasename = path.basename;
import pathDirname = path.dirname;
import pathExtname = path.extname;
import pathIsAbsolute = path.isAbsolute;
import pathJoin = path.join;

export class PathUtility {

    /**
     * Checks if a given path configuration exists, like `product` or `library`. Comes handy when need
     * working with relative paths.
     */
    static doesPathConfigurationExist(configuration: PathConfiguration, path: string, throwError?: boolean): boolean {
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
    static getCommonExtension(path: string | string[]): string {
        let paths: string[] = Array.isArray(path) ? <string[]>path : [<string>path];
        let pathCount: number = paths.length;
        let extension: string = null;

        for (let i: number = 0, n: number = pathCount; i < n; i++) {

            // The last thing we want to do is to lookup the filesystem, so we first try to get the file extension from the path,
            // then do the lookup. Also, we don't do lookups if count has exceeded the original paths length – in case glob
            // matched any files that have glob patterns within their name, to avoid the endless loop. Smart through the roof…

            let pathExtension: string = pathExtname(path = paths[i]);

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
    static getCommonDirectory(path: string | string[]): string {
        let paths: string[] = Array.isArray(path) ? <string[]>path : [<string>path];
        let pathCount: number = paths.length;
        let directory: string = null;

        for (let i: number = 0, n: number = pathCount; i < n; i++) {

            // Do check the relevant extension method. Here we check if the glob has magic and expand them,
            // otherwise / then do all the comparisons.

            let pathDirectory: string;

            path = paths[i];

            if (i < pathCount && glob.hasMagic(<string>path)) {
                paths = paths.concat(glob.sync(<string>path));
                n = paths.length;
            } else if ((pathDirectory = pathBasename(pathDirname(<string>path))) !== '' && pathDirectory !== '.') {
                if (directory === null) {
                    directory = pathDirectory;
                } else if (directory !== pathDirectory) {
                    return null;
                }
            }
        }

        return directory;
    }

    /**
     * Returns path directory of the given file / files. If path is a glob, attempts to expand it using fs lookup and
     * return directories from that.
     */
    static getDirectory(path: string | string[]): string[] {
        let paths: string[] = Array.isArray(path) ? <string[]>path : [<string>path];
        let pathCount: number = paths.length;
        let directories: string[] = [];

        for (let i: number = 0, n: number = pathCount; i < n; i++) {

            // Do check the relevant extension method. Here we check if the glob has magic and expand them,
            // otherwise / then do all the comparisons.

            let pathDirectory: string;

            path = paths[i];

            if (i < pathCount && glob.hasMagic(<string>path)) {
                paths = paths.concat(glob.sync(<string>path));
                n = paths.length;
            } else if ((pathDirectory = pathDirname(path = paths[i])) !== '' && pathDirectory !== '.') {
                directories.push(pathDirectory);
            }
        }

        return directories.length === 0 ? null : directories;
    }

    /**
     * Appends glob to a path if it's a directory, if it's not a directory, returns the path untouched. Two modes
     * to check if directory or not – soft, using extension without fs lookup, and hard, using fs lookup.
     */
    static globalisePath(path: string | string[], glob: string, soft: boolean = false): string | string[] {
        let array: boolean = Array.isArray(path);
        let paths: string[] = array ? <string[]>path : [<string>path];

        paths = paths.map(function (path: string): string {
            let file: boolean;

            // Here we assume that we don't receive glob files, but we still may receive negated / exclusion paths,
            // which will give exceptions.

            if (soft) {
                file = pathExtname(path) !== '';
            } else {
                try {
                    file = fs.statSync(path.charAt(0) === '!' ? path.slice(1) : path).isFile();
                } catch (error) {
                    file = false;
                }
            }

            return file ? path : pathJoin(path, glob);
        });

        return array ? paths : paths.pop();
    }

    /**
     * Normalises the given path in relation to the base path and appends the suffix. Normalisation involves
     * checking if the path is absolute and, if not, appending it to the base path.
     */
    static normalisePath(basePath: string | string[], path?: string | string[], suffix?: string): string | string[] {
        path == null && (path = '');

        let basePathArray: boolean = Array.isArray(basePath);
        let pathArray: boolean = Array.isArray(path);
        let paths: string[] = [];
        let extension: string;

        (<string[]>(pathArray ? path : [path])).forEach(function (path: string) {
            let negate: boolean;

            // Check if this is a negation.

            if (negate = path.charAt(0) === '!') {
                path = path.slice(1);
            }

            // Join target path with the group path if target path path is not absolute.

            if (!pathIsAbsolute(path)) {
                path = pathJoin(basePath, path);
            }

            (<string[]>(basePathArray ? basePath : [basePath])).forEach(function (basePath: string) {


                // Suffix gets appended only when we're dealing with folders and it doesn't already end with suffix. The
                // folder-part is checked only using the extension logic, which might actually be a problem. Todo: perhaps
                // todo: there should be an additional fs check, and then if the folder doesn't exist – do this shit.

                if (suffix != null && (extension = pathExtname(path)) === '' && path.slice(-suffix.length) !== suffix) {
                    path = pathJoin(path, suffix);
                }

                if (negate) {
                    path = '!' + path;
                }

                paths.push(path);
            });
        });

        // Try to return a single path if only a single item was supplied.

        return basePathArray || pathArray ? paths : paths.pop();
    }

    /**
     * Normalises dependency path.
     */
    static normaliseDependencyPath(configuration: PathConfiguration, dependency?: string | string[]): string | string[] {
        let basePath: string | string[] = configuration.dependency;

        if (basePath == null) {
            throw new Error('Path configuration must contain `dependency` option to normalise dependency.')
        }

        return PathUtility.normalisePath(basePath, dependency);
    }

    /**
     * Normalises destination path.
     */
    static normaliseDestinationPath(configuration: PathConfiguration, destination?: string | string[], suffix?: string): string | string[] {
        let basePath: string | string[] = configuration.destination == null ? configuration.product : configuration.destination;

        if (basePath == null) {
            throw new Error('Path configuration must contain `destination` or `product` option to normalise destination.')
        }

        return PathUtility.normalisePath(basePath, destination, suffix);
    }

    /**
     * Normalises library path.
     */
    static normaliseLibraryPath(configuration: PathConfiguration, library?: string | string[], suffix?: string): string | string[] {
        let basePath: string | string[] = configuration.library;

        if (basePath == null) {
            throw new Error('Path configuration must contain `library` option to normalise library.')
        }

        return PathUtility.normalisePath(basePath, library, suffix);
    }

    /**
     * Normalises source path.
     */
    static normaliseSourcePath(configuration: PathConfiguration, source?: string | string[], suffix?: string): string | string[] {
        let basePath: string = configuration.source;

        if (basePath == null) {
            throw new Error('Path configuration must contain `source` option to normalise source.')
        }

        return PathUtility.normalisePath(basePath, source, suffix);
    }

    /**
     * Normalises product path.
     */
    static normaliseProductPath(configuration: PathConfiguration, product?: string | string[], suffix?: string): string | string[] {
        let basePath: string = configuration.product;

        if (basePath == null) {
            throw new Error('Path configuration must contain `product` option to normalise product.')
        }

        return PathUtility.normalisePath(basePath, product, suffix);
    }
}