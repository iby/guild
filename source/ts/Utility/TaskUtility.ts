import {Path} from '../Configuration/Path';

import glob = require('glob');
import path = require('path');
import plumber = require('gulp-plumber');
import util = require('gulp-util');

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
    static doesPathConfigurationExist(configuration:Path, path:string, throwError?:boolean):boolean {
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
     * @param {Path} configuration
     * @param {String} group
     * @param {Array|String} [target]
     * @param {String} [suffix]
     * @returns {Array|String}
     */
    static normalisePath(configuration:Path, group:string, target?:string|string[], suffix?:string) {
        if (target == null) {
            target = '';
        }

        var array:boolean = Array.isArray(target);
        var targets:string[] = <string[]>(array ? target : [target]);
        var extension:string;

        for (var i:number = 0, n:number = targets.length; i < n; i++) {

            // Join target path with the group path if target path path is not absolute.

            if (!path.isAbsolute(target = targets[i]) && TaskUtility.doesPathConfigurationExist(configuration, group)) {
                target = path.join(configuration[group], target);
            }

            // Suffix gets appended only when we're dealing with folders and it doesn't already end with suffix. The
            // folder-part is checked only using the extension logic, which might actually be a problem. Todo: perhaps
            // todo: there should be an additional fs check, and then if the folder doesn't exist – do this shit.

            if (suffix != null && (extension = path.extname(<string>target)) === '' && target.slice(-suffix.length) !== suffix) {
                target = path.join(target, suffix);
            }

            targets[i] = <string>target;
        }

        // Try to return a single path if only a single item was supplied.

        return array || targets.length > 1 ? targets : targets[0];
    }

    /**
     * @param {Path} configuration
     * @param {Array|String} [source]
     * @param {String} [suffix]
     * @returns {Array|String}
     */
    static normaliseSourcePath(configuration:Path, source?:string|string[], suffix?:string) {
        return TaskUtility.normalisePath(configuration, 'source', source, suffix);
    }

    /**
     * @param {Path} configuration
     * @param {Array|String} [destination]
     * @param {String} [suffix]
     * @returns {Array|String}
     */
    static normaliseDestinationPath(configuration:any, destination?:string|string[], suffix?:string) {
        return TaskUtility.normalisePath(configuration, 'product', destination, suffix);
    }
}