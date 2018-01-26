import {BuildFactory} from './Task/BuildFactory';
import {DependencyFactory} from './Task/DependencyFactory';
import {DeployFactory} from './Task/DeployFactory';
import {Gulp} from 'gulp';
import {ParsedArgs} from 'minimist';
import {PathConfiguration} from './Configuration/PathConfiguration';

import clone = require('clone');
import help = require('gulp-help');
import minimist = require('minimist');

export type Configuration = [any, PathConfiguration];

/**
 * Todo: ideally `configuration` should be of type `GuildConfiguration` but that results in TypeScript pulling all sort of
 * todo: dependencies, making it hard to use in depending projects.
 */
export function guild(gulp: Gulp, configuration: any) {
    var [guildConfiguration, pathConfiguration]: Configuration = configuration;

    if (configuration == null) {
        return;
    }

    // Parse cli options. First three are command, gulp and task, we don't want either of them. Todo: what happens
    // todo: when we use this with without a task, i.e., default task?

    var parameters: ParsedArgs = minimist(process.argv.slice(3));

    // Make a copy of configuration so we can change and not affect the original object.

    guildConfiguration = clone(guildConfiguration);
    pathConfiguration = clone(pathConfiguration);
    gulp = help(gulp);

    guildConfiguration.dependency == null || DependencyFactory.construct(gulp, [guildConfiguration.dependency, pathConfiguration], parameters).construct();
    guildConfiguration.build == null || BuildFactory.construct(gulp, [guildConfiguration.build, pathConfiguration], parameters).construct();
    guildConfiguration.deploy == null || DeployFactory.construct(gulp, [guildConfiguration.deploy, pathConfiguration], parameters).construct();
}