/// <reference path="../../dependency/typings/reference.d.ts"/>
/// <reference path="../dts/reference.d.ts"/>

import {Guild} from './Configuration/Guild';
import {GulpHelp} from 'gulp-help';
import {ParsedArgs} from 'minimist';

import {build} from './build';
import {dependency} from './dependency';
import {deploy} from './deploy';

import clone = require('clone');
import help = require('gulp-help');
import minimist = require('minimist');

export function guild(gulp:GulpHelp, configuration:Guild) {
    if (configuration == null) {
        return;
    }

    gulp = help(gulp);

    // Todo: what happens when we use this with without a task, i.e., default task?
    // Parse cli options. First three are command, gulp and task, we don't want either of them.

    var parameters:ParsedArgs = minimist(process.argv.slice(3));

    // Make a copy of configuration so we can change and not affect the original object.

    configuration = clone(configuration);

    configuration.dependency != null || dependency(gulp, configuration, parameters);
    configuration.build == null || build(gulp, configuration, parameters);
    configuration.deploy == null || deploy(gulp, configuration, parameters);
}