import {GuildConfiguration} from './Configuration/GuildConfiguration';
import {ParsedArgs} from 'minimist';
import {Gulp} from 'gulp';
import {BuildFactory} from './Task/BuildFactory';
import {GulpHelp} from 'gulp-help';
import {dependency} from './dependency';
import {deploy} from './deploy';

import clone = require('clone');
import help = require('gulp-help');
import minimist = require('minimist');

export function guild(gulp:Gulp, configuration:GuildConfiguration) {
    if (configuration == null) {
        return;
    }

    // Parse cli options. First three are command, gulp and task, we don't want either of them.
    // Todo: what happens when we use this with without a task, i.e., default task?

    var parameters:ParsedArgs = minimist(process.argv.slice(3));

    // Make a copy of configuration so we can change and not affect the original object.

    configuration = clone(configuration);
    gulp = help(gulp);

    configuration.dependency == null || dependency(<GulpHelp>gulp, configuration, parameters);
    configuration.build == null || BuildFactory.construct(<GulpHelp>gulp, configuration, parameters).construct();
    configuration.deploy == null || deploy(<GulpHelp>gulp, configuration, parameters);
}