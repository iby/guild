'use strict';

/**
 * @name GuildConfiguration
 * @property {BuildConfiguration} build
 * @property {DependencyConfiguration} dependency
 * @property {DeployConfiguration} deploy
 * @property {Path} path
 */

var Task = require('./Constant/Task');
var Path = require('./Configuration/Path');
var Plugin = require('./Constant/Plugin');

var clone = require('clone');
var help = require('gulp-help');
var minimist = require('minimist');

/**
 * @param {Gulp} gulp
 * @param {GuildConfiguration} configuration
 */
function guild(gulp, configuration) {
    if (configuration == null) {
        return;
    }

    gulp = help(gulp);

    // Todo: what happens when we use this with without a task, i.e., default task?
    // Parse cli options. First three are command, gulp and task, we don't want either of them.

    var parameters = minimist(process.argv.slice(3));

    // Make a copy of configuration so we can change and not affect the original object.

    configuration = clone(configuration);

    configuration[Task.BUILD] == null || require('./build')(gulp, configuration, parameters);
    configuration[Task.DEPENDENCY] == null || require('./dependency')(gulp, configuration, parameters);
    configuration[Task.DEPLOY] == null || require('./deploy')(gulp, configuration, parameters);
}

module.exports = guild;
module.exports.Path = Path;
module.exports.Plugin = Plugin;
