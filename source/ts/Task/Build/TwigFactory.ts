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
import twig = require('gulp-twig');

// Internal configuration format.

export type Configuration = [TwigConfiguration, PathConfiguration];

export interface TwigConfiguration extends ConfigurationInterface {
    clean?:boolean;
    data?:any;
    destination:string|string[];
    plugins?:PluginGenerators;
    source:string|string[];
    watch?:boolean;
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
        var source:string|string[];
        var watch:boolean;

        // Normalise configuration, we may simply pass twig data as twig configuration, this we check if that object
        // compares at all to expected configuration.

        if (typeof twigConfiguration === DataType.BOOLEAN) {
        } else if (twigConfiguration.clean != null || twigConfiguration.source != null || twigConfiguration.destination != null || twigConfiguration.plugins != null || twigConfiguration.watch != null) {
            clean = twigConfiguration.clean;
            data = twigConfiguration.data;
            destination = twigConfiguration.destination;
            plugins = twigConfiguration.plugins;
            source = twigConfiguration.source;
            watch = twigConfiguration.watch;
        } else {
            data = twigConfiguration;
        }

        destination == null && (destination = 'html');
        source == null && (source = 'twig');
        plugins == null && (plugins = []);

        // Rebuild twig configuration.

        twigConfiguration = <TwigConfiguration>{
            clean: clean !== false,
            data: data,
            destination: destination,
            plugins: plugins,
            source: source,
            watch: watch === true || parameters[Parameter.WATCH] === true
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
            twigConfiguration.clean ? this.constructClean(gulp, TaskName.BUILD_TWIG_CLEAN, PathUtility.normaliseDestinationPath(pathConfiguration, twigConfiguration.destination, '*')) : [],
            twigConfiguration.watch ? this.constructWatch(gulp, TaskName.BUILD_TWIG_WATCH, PathUtility.normaliseSourcePath(pathConfiguration, twigConfiguration.source, '**/*.twig'), task) : []
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

            stream = gulp.src(PathUtility.normaliseSourcePath(pathConfiguration, twigConfiguration.source, '**/*.twig')).pipe(this.constructPlumber());
            stream = self.constructStream(stream, configuration);
            stream = self.constructDestination(stream, gulp, PathUtility.normaliseDestinationPath(pathConfiguration, twigConfiguration.destination));

            return stream;
        });

        return [TaskName.BUILD_TWIG];
    }

    /**
     * @inheritDoc
     */
    public constructPipeline(configuration:Configuration):Pipeline {
        var [twigConfiguration, pathConfiguration]:Configuration = configuration;
        var plugins:any = twigConfiguration.plugins instanceof Function ? twigConfiguration.plugins : function () { return clone(twigConfiguration.plugins) };
        var index:number;

        (plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
        (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.TWIG);
        (index = plugins.indexOf(Plugin.TWIG)) >= 0 && plugins.splice(index, 1, twig(twigConfiguration.data));

        return this.pipelineStreams(plugins);
    }
}