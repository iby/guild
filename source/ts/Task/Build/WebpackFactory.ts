import {AbstractFactory, Task} from './AbstractFactory';
import {GulpHelp} from 'gulp-help';
import {Option} from '../Option';
import {Parameter} from '../../Constant/Parameter';
import {ParsedArgs} from 'minimist';
import {PathConfiguration} from '../../Configuration/PathConfiguration';
import {Pipeline, ReadWriteStream} from '../../Stream/Pipeline';
import {PluginGenerators, ConfigurationInterface} from '../../Configuration/Configuration';
import {Plugin} from '../../Constant/Plugin';
import {Task as TaskName} from '../../Constant/Task';
import {PathUtility} from '../../Utility/PathUtility';

import clone = require('clone');
import webpack = require('webpack-stream');

// Internal configuration format.

export type Configuration = [WebpackConfiguration, PathConfiguration];

export interface WebpackConfiguration extends ConfigurationInterface {
    clean?:boolean;
    configuration?:any;
    destination:string|string[];
    plugins?:PluginGenerators;
    source:string|string[];
    watch?:boolean;
}

/**
 * Creates and registers webpack build tasks.
 */
export class WebpackFactory extends AbstractFactory {
    /**
     * @inheritDoc
     */
    protected option:Option = new Option('webpack', 'Build js sources with webpack.');

    /**
     * @inheritDoc
     */
    public normaliseConfiguration(configuration:Configuration, parameters?:ParsedArgs):Configuration {
        var [webpackConfiguration, pathConfiguration]:Configuration = configuration;

        // Options.

        var clean:boolean;
        var compilerConfiguration:any;
        var destination:string|string[];
        var plugins:PluginGenerators;
        var pluginsGenerator:Function;
        var source:string|string[];
        var watch:boolean;

        // Normalise configuration.

        if (webpackConfiguration.clean != null || webpackConfiguration.source != null || webpackConfiguration.destination != null || webpackConfiguration.configuration != null || webpackConfiguration.watch != null) {
            clean = webpackConfiguration.clean;
            compilerConfiguration = webpackConfiguration.configuration;
            destination = webpackConfiguration.destination;
            plugins = webpackConfiguration.plugins;
            source = webpackConfiguration.source;
            watch = webpackConfiguration.watch;
        } else {
            compilerConfiguration = webpackConfiguration;
        }

        source == null && (source = 'js');
        destination == null && (destination = 'js');
        plugins == null && (plugins = []);

        // Rebuild less configuration.

        webpackConfiguration = <WebpackConfiguration>{
            clean: clean !== false,
            configuration: compilerConfiguration,
            destination: destination,
            plugins: plugins,
            source: source,
            watch: watch === true || parameters[Parameter.WATCH] === true
        };

        return [webpackConfiguration, pathConfiguration];
    }

    /**
     * @inheritDoc
     */
    public construct():Task {
        super.construct();

        var configuration:Configuration = this.normaliseConfiguration(this.configuration, this.parameters);
        var [webpackConfiguration, pathConfiguration]:Configuration = configuration;
        var gulp:GulpHelp = this.gulp;
        var task:string[];

        return [
            task = this.constructTask(gulp, configuration),
            webpackConfiguration.clean ? this.constructClean(gulp, TaskName.BUILD_WEBPACK_CLEAN, PathUtility.normaliseDestinationPath(pathConfiguration, webpackConfiguration.destination, '*')) : [],
            webpackConfiguration.watch ? this.constructWatch(gulp, TaskName.BUILD_WEBPACK_WATCH, PathUtility.normaliseSourcePath(pathConfiguration, webpackConfiguration.source, '**/*.js'), task) : []
        ];
    }

    /**
     * @inheritDoc
     */
    public constructTask(gulp:GulpHelp, configuration:Configuration):string[] {
        var self:WebpackFactory = this;

        gulp.task(TaskName.BUILD_WEBPACK, false, function () {
            var [webpackConfiguration, pathConfiguration] = configuration;
            var stream:ReadWriteStream;

            stream = gulp.src(PathUtility.normaliseSourcePath(pathConfiguration, webpackConfiguration.source, '**/*.js')).pipe(this.constructPlumber());
            stream = self.constructStream(stream, configuration);
            stream = self.constructDestination(stream, gulp, PathUtility.normaliseDestinationPath(pathConfiguration, webpackConfiguration.destination));

            return stream;
        });

        return [TaskName.BUILD_WEBPACK];
    }

    /**
     * @inheritDoc
     */
    public constructPipeline(configuration:Configuration):Pipeline {
        var [webpackConfiguration, pathConfiguration]:Configuration = configuration;
        var plugins:any = webpackConfiguration.plugins instanceof Function ? webpackConfiguration.plugins : function () { return clone(webpackConfiguration.plugins) };
        var index:number;

        (plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
        (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.WEBPACK);
        (index = plugins.indexOf(Plugin.WEBPACK)) >= 0 && plugins.splice(index, 1, webpack(webpackConfiguration.configuration));

        return this.pipelineStreams(plugins);
    }
}