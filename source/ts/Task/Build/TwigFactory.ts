import {AbstractFactory, Task} from './AbstractFactory';
import {DataType} from '../../Constant/DataType';
import {GulpHelp} from 'gulp-help';
import {Option} from '../Option';
import {Parameter} from '../../Constant/Parameter';
import {ParsedArgs} from 'minimist';
import {PathConfiguration} from '../../Configuration/PathConfiguration';
import {Pipeline, ReadWriteStream} from '../../Stream/Pipeline';
import {Plugin} from '../../Constant/Plugin';
import {PathUtility} from '../../Utility/PathUtility';
import {Task as TaskName} from '../../Constant/Task';
import {PluginGenerators, ConfigurationInterface} from '../../Configuration/Configuration';

import clone = require('clone');
import del = require('del');
import path = require('path');
import twig = require('gulp-twig');

// Internal configuration format.

export type Configuration = [TwigConfiguration, PathConfiguration];

export interface TwigConfiguration extends ConfigurationInterface {
    clean?:boolean;
    data?:any;
    destination:string|string[];
    options?:any, // Todo: gulp-twig plugin options, ideally can be replaced with https://github.com/zimmen/gulp-twig/issues/25
    plugins?:PluginGenerators;
    source:string|string[];
    watch?:boolean|string|string[];
}

/**
 * Creates and registers twig build tasks.
 */
export class TwigFactory extends AbstractFactory {
    /**
     * @inheritDoc
     */
    protected option:Option = new Option('twig', 'Build twig sources.');

    /**
     * @inheritDoc
     */
    public normaliseConfiguration(configuration:Configuration, parameters?:ParsedArgs):Configuration {
        var [twigConfiguration, pathConfiguration]:Configuration = configuration;

        // Options.

        var clean:boolean;
        var data:any;
        var destination:string|string[];
        var plugins:PluginGenerators;
        var options:any;
        var source:string|string[];
        var watch:boolean|string|string[];

        // Normalise configuration, we may simply pass twig data as twig configuration, this we check if that object
        // compares at all to expected configuration.

        if (typeof twigConfiguration === DataType.BOOLEAN) {
        } else if (twigConfiguration.clean != null || twigConfiguration.source != null || twigConfiguration.destination != null || twigConfiguration.plugins != null || twigConfiguration.watch != null) {
            clean = twigConfiguration.clean;
            data = twigConfiguration.data;
            destination = twigConfiguration.destination;
            options = twigConfiguration.options;
            plugins = twigConfiguration.plugins;
            source = twigConfiguration.source;
            watch = twigConfiguration.watch;
        } else {
            data = twigConfiguration;
        }

        destination == null && (destination = 'html');
        source == null && (source = 'twig');
        plugins == null && (plugins = []);
        watch == null && (watch = watch === true || parameters[Parameter.WATCH] === true);

        options == null && (options = {});
        data == null || (options.data = data);

        // Rebuild twig configuration.

        twigConfiguration = <TwigConfiguration>{
            clean: clean !== false,
            destination: destination,
            options: options,
            plugins: plugins,
            source: source,
            watch: watch
        };

        return [twigConfiguration, pathConfiguration];
    }

    /**
     * @inheritDoc
     */
    public construct():Task {
        super.construct();

        var configuration:Configuration = this.normaliseConfiguration(this.configuration, this.parameters);
        var [twigConfiguration, pathConfiguration]:Configuration = configuration;
        var gulp:GulpHelp = this.gulp;
        var task:string[];

        return [
            task = this.constructTask(gulp, configuration),
            this.constructClean(gulp, configuration),
            this.constructWatch(gulp, configuration, task)
        ];
    }

    /**
     * @inheritDoc
     */
    public constructTask(gulp:GulpHelp, configuration:Configuration):string[] {
        var self:TwigFactory = this;

        gulp.task(TaskName.BUILD_TWIG, false, function () {
            var [twigConfiguration, pathConfiguration] = configuration;
            var stream:ReadWriteStream;

            stream = gulp.src(PathUtility.globalisePath(PathUtility.normaliseSourcePath(pathConfiguration, twigConfiguration.source), '**/*.twig')).pipe(self.constructPlumber());
            stream = self.constructStream(stream, configuration);
            stream = self.constructDestination(stream, gulp, PathUtility.normaliseDestinationPath(pathConfiguration, twigConfiguration.destination));

            return stream;
        });

        return [TaskName.BUILD_TWIG];
    }

    /**
     * @inheritDoc
     */
    public constructClean(gulp:GulpHelp, configuration:Configuration):string[] {
        var [twigConfiguration, pathConfiguration]:Configuration = configuration;
        var clean:boolean = twigConfiguration.clean;
        var task:string = TaskName.BUILD_TWIG_CLEAN;

        if (clean === true) {
            return [];
        }

        gulp.task(task, false, function () {
            var path:string|string[] = PathUtility.globalisePath(PathUtility.normaliseDestinationPath(pathConfiguration, twigConfiguration.destination), '**/*.html');
            return del(path, {force: true});
        });

        return [task];
    }

    /**
     * @inheritDoc
     */
    public constructWatch(gulp:GulpHelp, configuration:Configuration, tasks:string[]):string[] {
        var [twigConfiguration, pathConfiguration]:Configuration = configuration;
        var watch:any = twigConfiguration.watch;
        var task:string = TaskName.BUILD_TWIG_WATCH;

        if (watch === false) {
            return [];
        }

        gulp.task(task, false, function () {

            // When no explicit watch paths are given, use default twig source location, otherwise normalise paths
            // relative to the root directory. Todo: must take into account `configuration.source`…

            var path:string|string[] = watch === true
                ? PathUtility.normaliseSourcePath(pathConfiguration, 'twig/**/*.twig')
                : PathUtility.normalisePath(pathConfiguration.root, watch);

            return gulp.watch(path, tasks);
        });

        return [task];
    }

    /**
     * @inheritDoc
     */
    public constructPipeline(configuration:Configuration):Pipeline {
        var [twigConfiguration, pathConfiguration]:Configuration = configuration;
        var plugins:any = twigConfiguration.plugins instanceof Function ? twigConfiguration.plugins : function () { return clone(twigConfiguration.plugins); };
        var index:number;

        (plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
        (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.TWIG);
        (index = plugins.indexOf(Plugin.TWIG)) >= 0 && plugins.splice(index, 1, twig(twigConfiguration.options));

        return this.pipelineStreams(plugins);
    }
}