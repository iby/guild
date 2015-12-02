'use strict';

var minimist = require('minimist');

function guild(gulp, configuration) {
    if (configuration == null) {
        return;
    }

    gulp = require('gulp-help')(gulp);

    // Parse cli options. First three are command, gulp and task, we don't want either of them.

    var parameters = minimist(process.argv.slice(3));

    configuration['build'] == null || require('./build')(gulp, configuration['build'], parameters);
}

module.exports = guild;