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
    clean?: boolean;
    destination: string | string[];
    plugins?: PluginGenerator;
    source: string | string[];
    watch?: boolean;
}

/**
 * Creates and registers name build tasks.
 */
export class CopyFactory extends AbstractFactory {

    /**
     * @inheritDoc
     */
    public normaliseConfigurations(configuration: Configuration, parameters?: ParsedArgs): Configurations {
        let [copyConfiguration, pathConfiguration]: Configuration = configuration;
        let copyConfigurations: CopyConfiguration[] = [];
        let self: CopyFactory = this;

        let array: boolean = Array.isArray(copyConfiguration);
        let object: boolean = typeof copyConfiguration === DataType.OBJECT;

        if (!object && !array) {
            throw new NormaliseConfigurationError('Expecting either an object or array, received something totally different.');
        } else if (array) {
            copyConfigurations = <any>copyConfiguration;
        } else {
            copyConfigurations = [copyConfiguration];
        }

        copyConfigurations = copyConfigurations.map(function (configuration: CopyConfiguration): CopyConfiguration {
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
    public normaliseConfiguration(configuration: CopyConfiguration, parameters?: ParsedArgs): CopyConfiguration {
        let clean: boolean;
        let destination: string | string[];
        let plugins: PluginGenerator;
        let source: string | string[];
        let watch: boolean;

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
    public construct(): Task {
        super.construct();

        let configurations: Configurations = this.normaliseConfigurations(this.configuration, this.parameters);
        let [copyConfigurations, pathConfiguration]: Configurations = configurations;
        let gulp: GulpHelp = this.gulp;
        let task: string[];

        return [
            task = this.constructTask(gulp, configurations),
            this.constructClean(gulp, configurations),
            this.constructWatch(gulp, configurations, task)
        ];
    }

    /**
     * @inheritDoc
     */
    public constructTask(gulp: GulpHelp, configurations: Configurations): string[] {
        let [copyConfigurations, pathConfiguration]: Configurations = configurations;
        let task: string = this.name;
        let self: CopyFactory = this;

        gulp.task(task, false, function () {
            let streams: ReadWriteStream[] = [];

            for (let copyConfiguration of copyConfigurations) {
                let stream: ReadWriteStream;

                stream = gulp.src(PathUtility.globalisePath(PathUtility.normalisePath(pathConfiguration.root, copyConfiguration.source), '**/*'));
                stream = self.constructStream(stream, copyConfiguration);
                stream = self.constructDestination(stream, gulp, PathUtility.normalisePath(pathConfiguration.root, copyConfiguration.destination));

                streams.push(stream);
            }

            return streams.length > 1 ? merge(...streams) : streams.pop();
        });

        return [task];
    }

    /**
     * @inheritDoc
     */
    public constructPipeline(configuration: CopyConfiguration): Pipeline {
        let plugins: any[] = this.constructPlugins(configuration.plugins);
        return this.pipelineStreams(plugins);
    }

    /**
     * @inheritDoc
     */
    public constructClean(gulp: GulpHelp, configuration: Configurations): string[] {
        let [copyConfigurations, pathConfiguration]: Configurations = configuration;
        let task: string;

        copyConfigurations = copyConfigurations.filter(function (copyConfiguration: CopyConfiguration) {
            return copyConfiguration.clean === true;
        });

        if (copyConfigurations.length === 0) {
            return [];
        }

        gulp.task(task = this.name + '-clean', false, function () {
            let promises: Promise<void>[] = [];

            for (let copyConfiguration of copyConfigurations) {
                let path: string | string[] = PathUtility.globalisePath(PathUtility.normalisePath(pathConfiguration.root, copyConfiguration.destination), '**/*');
                promises.push(del(path, {force: true}));
            }

            return promises.length > 1 ? Promise.all(promises) : promises.pop();
        });

        return [task];
    }

    /**
     * @inheritDoc
     */
    public constructWatch(gulp: GulpHelp, configuration: Configurations, tasks: string[]): string[] {
        let [copyConfigurations, pathConfiguration]: Configurations = configuration;
        let task: string;

        copyConfigurations = copyConfigurations.filter(function (copyConfiguration: CopyConfiguration) {
            return copyConfiguration.watch === true;
        });

        if (copyConfigurations.length === 0) {
            return [];
        }

        gulp.task(task = this.name + '-watch', false, function () {
            for (let copyConfiguration of copyConfigurations) {
                let path: string | string[] = PathUtility.globalisePath(PathUtility.normalisePath(pathConfiguration.root, copyConfiguration.source), '**/*');
                gulp.watch(path, tasks);
            }
        });

        return [task];
    }
}