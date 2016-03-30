import {AbstractFactory, Task} from './AbstractFactory';
import {ConfigurationInterface, PluginGenerator} from '../../Configuration/Configuration';
import {DataType} from '../../Constant/DataType';
import {GulpHelp} from 'gulp-help';
import {NormaliseConfigurationError} from '../AbstractFactory';
import {Parameter} from '../../Constant/Parameter';
import {ParsedArgs} from 'minimist';
import {PathConfiguration} from '../../Configuration/PathConfiguration';
import {PathUtility} from '../../Utility/PathUtility';
import {ReadWriteStream, Pipeline} from '../../Stream/Pipeline';

import clone = require('clone');
import del = require('del');
import merge = require("merge-stream");

// Internal configuration format.

export type Configuration = [CopyConfiguration, PathConfiguration];
export type Configurations = [CopyConfiguration[], PathConfiguration];

export interface CopyConfiguration extends ConfigurationInterface {
    clean?:boolean;
    destination:string|string[];
    plugins?:PluginGenerator;
    source:string|string[];
    watch?:boolean;
}

/**
 * Creates and registers name build tasks.
 */
export class CopyFactory extends AbstractFactory {

    /**
     * @inheritDoc
     */
    public normaliseConfigurations(configuration:Configuration, parameters?:ParsedArgs):Configurations {
        var [copyConfiguration, pathConfiguration]:Configuration = configuration;
        var copyConfigurations:CopyConfiguration[] = [];
        var self:CopyFactory = this;

        var array:boolean = Array.isArray(copyConfiguration);
        var object:boolean = typeof copyConfiguration === DataType.OBJECT;

        if (!object && !array) {
            throw new NormaliseConfigurationError('Expecting either an object or array, received something totally different.');
        } else if (array) {
            copyConfigurations = <any>copyConfiguration;
        } else {
            copyConfigurations = [copyConfiguration];
        }

        copyConfigurations = copyConfigurations.map(function (configuration:CopyConfiguration):CopyConfiguration {
            if (typeof configuration !== DataType.OBJECT) {
                throw new NormaliseConfigurationError('Unexpected object format.');
            }

            return self.normaliseConfiguration(configuration, parameters);
        });

        return [copyConfigurations, pathConfiguration];
    }

    /**
     * @inheritDoc
     */
    public normaliseConfiguration(configuration:CopyConfiguration, parameters?:ParsedArgs):CopyConfiguration {
        var clean:boolean;
        var destination:string|string[];
        var plugins:PluginGenerator;
        var source:string|string[];
        var watch:boolean;

        if (typeof configuration === DataType.BOOLEAN) {
        } else {
            clean = configuration.clean;
            destination = configuration.destination;
            plugins = configuration.plugins;
            source = configuration.source;
            watch = configuration.watch;
        }

        plugins == null && (plugins = null);
        watch == null && (watch = watch === true || parameters[Parameter.WATCH] === true);

        configuration = <CopyConfiguration>{
            clean: clean !== false,
            destination: destination,
            plugins: plugins,
            source: source,
            watch: watch
        };

        return configuration;
    }

    /**
     * @inheritDoc
     */
    public construct():Task {
        super.construct();

        var configurations:Configurations = this.normaliseConfigurations(this.configuration, this.parameters);
        var [copyConfigurations, pathConfiguration]:Configurations = configurations;
        var gulp:GulpHelp = this.gulp;
        var task:string[];

        return [
            task = this.constructTask(gulp, configurations),
            this.constructClean(gulp, configurations),
            this.constructWatch(gulp, configurations, task)
        ];
    }

    /**
     * @inheritDoc
     */
    public constructTask(gulp:GulpHelp, configurations:Configurations):string[] {
        var [copyConfigurations, pathConfiguration]:Configurations = configurations;
        var task:string = this.name;
        var self:CopyFactory = this;

        gulp.task(task, false, function () {
            var streams:ReadWriteStream[] = [];

            for (let copyConfiguration of copyConfigurations) {
                var stream:ReadWriteStream;

                stream = gulp.src(PathUtility.globalisePath(PathUtility.normalisePath(pathConfiguration.root, copyConfiguration.source), '**/*'));
                stream = self.constructStream(stream, copyConfiguration);
                stream = self.constructDestination(stream, gulp, PathUtility.normalisePath(pathConfiguration.root, copyConfiguration.destination));

                streams.push(stream);
            }

            return streams.length > 1 ? merge(...streams) : streams.pop;
        });

        return [task];
    }

    /**
     * @inheritDoc
     */
    public constructPipeline(configuration:CopyConfiguration):Pipeline {
        var plugins:any[] = this.constructPlugins(configuration.plugins);
        return this.pipelineStreams(plugins);
    }

    /**
     * @inheritDoc
     */
    public constructClean(gulp:GulpHelp, configuration:Configurations):string[] {
        var [copyConfigurations, pathConfiguration]:Configurations = configuration;
        var task:string = this.name + '-clean';

        copyConfigurations = copyConfigurations.filter(function (copyConfiguration:CopyConfiguration) {
            return copyConfiguration.clean === true;
        });

        if (copyConfigurations.length === 0) {
            return [];
        }

        gulp.task(task, false, function () {
            var streams:ReadWriteStream[] = [];

            for (let copyConfiguration of copyConfigurations) {
                var path:string|string[] = PathUtility.globalisePath(PathUtility.normalisePath(pathConfiguration.root, copyConfiguration.destination), '**/*');
                streams.push(del(path, {force: true}));
            }

            return streams.length > 1 ? merge(...streams) : streams.pop;
        });

        return [task];
    }

    /**
     * @inheritDoc
     */
    public constructWatch(gulp:GulpHelp, configuration:Configurations, tasks:string[]):string[] {
        var [copyConfigurations, pathConfiguration]:Configurations = configuration;
        var task:string = this.name + '-watch';

        copyConfigurations = copyConfigurations.filter(function (copyConfiguration:CopyConfiguration) {
            return copyConfiguration.watch === true;
        });

        if (copyConfigurations.length === 0) {
            return [];
        }

        gulp.task(task, false, function () {
            for (let copyConfiguration of copyConfigurations) {
                var path:string|string[] = PathUtility.globalisePath(PathUtility.normalisePath(pathConfiguration.root, copyConfiguration.source), '**/*');
                gulp.watch(path, tasks);
            }
        });

        return [task];
    }
}