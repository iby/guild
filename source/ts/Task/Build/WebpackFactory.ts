import {AbstractFactory, Task} from './AbstractFactory';
import {ConfigurationInterface, PluginGenerator} from '../../Configuration/Configuration';
import {GulpHelp} from 'gulp-help';
import {Option} from '../Option';
import {Parameter} from '../../Constant/Parameter';
import {ParsedArgs} from 'minimist';
import {PathConfiguration} from '../../Configuration/PathConfiguration';
import {PathUtility} from '../../Utility/PathUtility';
import {Pipeline, ReadWriteStream} from '../../Stream/Pipeline';
import {Plugin} from '../../Constant/Plugin';
import {Task as TaskName} from '../../Constant/Task';

import clone = require('clone');
import del = require('del');
import uglify = require('gulp-uglify');
import webpack = require('webpack-stream');

// Internal configuration format.

export type Configuration = [WebpackConfiguration, PathConfiguration];

export interface WebpackConfiguration extends ConfigurationInterface {
    clean?: boolean;
    configuration?: any;
    destination: string | string[];
    plugins?: PluginGenerator;
    production?: boolean;
    source: string | string[];
    watch?: boolean;
}

/**
 * Creates and registers webpack build tasks.
 */
export class WebpackFactory extends AbstractFactory {
    /**
     * @inheritDoc
     */
    public name: string = TaskName.BUILD_WEBPACK;
    /**
     * @inheritDoc
     */
    protected option: Option = new Option('webpack', 'Build js sources with webpack.');

    /**
     * @inheritDoc
     */
    public normaliseConfiguration(configuration: Configuration, parameters?: ParsedArgs): Configuration {
        let [webpackConfiguration, pathConfiguration]: Configuration = configuration;

        // Options.

        let clean: boolean;
        let compilerConfiguration: any;
        let destination: string | string[];
        let plugins: PluginGenerator;
        let production: boolean;
        let source: string | string[];
        let watch: boolean;

        // Normalise configuration.

        if (webpackConfiguration.clean != null || webpackConfiguration.source != null || webpackConfiguration.destination != null || webpackConfiguration.configuration != null || webpackConfiguration.watch != null) {
            clean = webpackConfiguration.clean;
            compilerConfiguration = webpackConfiguration.configuration;
            destination = webpackConfiguration.destination;
            plugins = webpackConfiguration.plugins;
            production = webpackConfiguration.production;
            source = webpackConfiguration.source;
            watch = webpackConfiguration.watch;
        } else {
            compilerConfiguration = webpackConfiguration;
        }

        source == null && (source = 'js');
        destination == null && (destination = 'js');
        plugins == null && (plugins = null);
        watch == null && (watch = watch === true || parameters[Parameter.WATCH] === true);
        production == null && (production = production === true || parameters[Parameter.PRODUCTION] === true);

        // Rebuild less configuration.

        webpackConfiguration = <WebpackConfiguration>{
            clean: clean !== false,
            configuration: compilerConfiguration,
            destination: destination,
            plugins: plugins,
            production: production,
            source: source,
            watch: watch
        };

        return [webpackConfiguration, pathConfiguration];
    }

    /**
     * @inheritDoc
     */
    public construct(): Task {
        super.construct();

        let configuration: Configuration = this.normaliseConfiguration(this.configuration, this.parameters);
        let [webpackConfiguration, pathConfiguration]: Configuration = configuration;
        let gulp: GulpHelp = this.gulp;
        let task: string[];

        return [
            task = this.constructTask(gulp, configuration),
            webpackConfiguration.clean ? this.constructClean(gulp, configuration) : [],
            webpackConfiguration.watch ? this.constructWatch(gulp, configuration, task) : []
        ];
    }

    /**
     * @inheritDoc
     */
    public constructTask(gulp: GulpHelp, configuration: Configuration): string[] {
        let self: WebpackFactory = this;

        gulp.task(TaskName.BUILD_WEBPACK, false, function () {
            let [webpackConfiguration, pathConfiguration] = configuration;
            let stream: ReadWriteStream;

            stream = gulp.src(PathUtility.globalisePath(PathUtility.normaliseSourcePath(pathConfiguration, webpackConfiguration.source), '**/*.js')).pipe(self.constructPlumber());
            stream = self.constructStream(stream, webpackConfiguration);
            stream = self.constructDestination(stream, gulp, PathUtility.normaliseDestinationPath(pathConfiguration, webpackConfiguration.destination));

            return stream;
        });

        return [TaskName.BUILD_WEBPACK];
    }

    /**
     * @inheritDoc
     */
    public constructPipeline(configuration: WebpackConfiguration): Pipeline {
        let plugins: any[] = this.constructPlugins(configuration.plugins);
        let index: number;

        (plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
        (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.WEBPACK);

        if ((index = plugins.indexOf(Plugin.WEBPACK)) >= 0) {
            plugins.splice(index++, 1, webpack(configuration.configuration));
            configuration.production && plugins.splice(index, 0, uglify())
        }

        return this.pipelineStreams(plugins);
    }

    /**
     * @inheritDoc
     */
    public constructClean(gulp: GulpHelp, configuration: Configuration): string[] {
        let [webpackConfiguration, pathConfiguration]: Configuration = configuration;
        let task: string;

        if (webpackConfiguration.clean === false) {
            return [];
        }

        gulp.task(task = this.name + '-clean', false, function () {
            let path: string | string[] = PathUtility.globalisePath(PathUtility.normaliseDestinationPath(pathConfiguration, webpackConfiguration.destination), '**/*.js');
            return del(path, {force: true});
        });

        return [task];
    }

    /**
     * @inheritDoc
     */
    public constructWatch(gulp: GulpHelp, configuration: Configuration, tasks: string[]): string[] {
        let [webpackConfiguration, pathConfiguration]: Configuration = configuration;
        let watch: any = webpackConfiguration.watch;
        let task: string;

        if (watch === false) {
            return [];
        }

        gulp.task(task = this.name + '-watch', false, function () {

            // When no explicit watch paths are given, use default twig source location, otherwise normalise paths
            // relative to the root directory. Todo: must take into account `configuration.source`…

            let path: string | string[] = watch === true
                ? PathUtility.normaliseSourcePath(pathConfiguration, 'js/**/*.js')
                : PathUtility.normalisePath(pathConfiguration.root, watch);

            return gulp.watch(path, tasks);
        });

        return [task];
    }
}