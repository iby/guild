import {BuildFactory} from './Task/BuildFactory';
import {DependencyFactory} from './Task/DependencyFactory';
import {DeployFactory} from './Task/DeployFactory';
import {GuildConfiguration} from './Configuration/GuildConfiguration';
import {Gulp} from 'gulp';
import {ParsedArgs} from 'minimist';

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

    configuration.dependency == null || DependencyFactory.construct(gulp, configuration, parameters).construct();
    configuration.build == null || BuildFactory.construct(gulp, configuration, parameters).construct();
    configuration.deploy == null || DeployFactory.construct(gulp, configuration, parameters).construct();
}