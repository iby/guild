import {AbstractBuildFactory, Task} from './AbstractBuildFactory';
import {DataType} from '../../Constant/DataType';
import {GulpHelp} from 'gulp-help';
import {LessConfiguration, BuildConfiguration, PluginGenerator} from '../../Configuration/GuildConfiguration';
import {Option} from '../Option';
import {Parameter} from '../../Constant/Parameter';
import {ParsedArgs} from 'minimist';
import {PathConfiguration} from '../../Configuration/PathConfiguration';
import {Pipeline, ReadWriteStream} from '../../Stream/Pipeline';
import {Plugin} from '../../Constant/Plugin';
import {Task as TaskName} from '../../Constant/Task';
import {TaskUtility} from '../../Utility/TaskUtility';

import clone = require('clone');
import less = require('gulp-less');
import debug = require('gulp-debug');
import postcss = require('gulp-postcss');

export type Configuration = [LessConfiguration, PathConfiguration];

/**
 * Creates and registers less build tasks.
 */
export class LessFactory extends AbstractBuildFactory {

    /**
     * @inheritDoc
     */
    protected option:Option = new Option('less', 'Build less sources.');

    /**
     * @inheritDoc
     */
    protected normaliseConfiguration(configuration:BuildConfiguration, parameters:ParsedArgs):Configuration {
        var lessConfiguration:LessConfiguration = configuration.less;
        var pathConfiguration:PathConfiguration = configuration.path;

        // Options.

        var clean:boolean;
        var destination:string|string[];
        var plugins:any[]|PluginGenerator;
        var source:string|string[];
        var watch:boolean;

        // Normalise configuration.

        if (typeof lessConfiguration === DataType.BOOLEAN) {
        } else {
            clean = lessConfiguration.clean;
            destination = lessConfiguration.destination;
            plugins = lessConfiguration.plugins;
            source = lessConfiguration.source;
            watch = lessConfiguration.watch;
        }

        source == null && (source = 'less');
        destination == null && (destination = 'css');
        plugins == null && (plugins = []);

        // Rebuild less configuration.

        lessConfiguration = <LessConfiguration>{
            clean: clean !== false,
            destination: destination,
            plugins: plugins,
            source: source,
            watch: watch === true || parameters[Parameter.WATCH] === true
        };

        return [lessConfiguration, pathConfiguration];
    }

    /**
     * @inheritDoc
     */
    public construct():Task {
        super.construct();

        var configuration:Configuration = this.normaliseConfiguration(this.configuration, this.parameters);
        var [lessConfiguration, pathConfiguration]:Configuration = configuration;
        var gulp:GulpHelp = this.gulp;
        var task:string[];

        return [
            task = this.constructTask(gulp, configuration),
            lessConfiguration.clean ? this.constructClean(gulp, TaskName.BUILD_LESS_CLEAN, TaskUtility.normaliseDestinationPath(pathConfiguration, lessConfiguration.destination, '*')) : [],
            lessConfiguration.watch ? this.constructWatch(gulp, TaskName.BUILD_LESS_WATCH, TaskUtility.normaliseSourcePath(pathConfiguration, lessConfiguration.source, '**/*.less'), task) : []
        ];
    }

    /**
     * @inheritDoc
     */
    public constructTask(gulp:GulpHelp, configuration:Configuration):string[] {
        var self:LessFactory = this;

        gulp.task(TaskName.BUILD_LESS, false, function () {
            var [lessConfiguration, pathConfiguration] = configuration;
            var stream:ReadWriteStream;

            stream = gulp.src(TaskUtility.normaliseSourcePath(pathConfiguration, lessConfiguration.source, '**/*.less')).pipe(TaskUtility.createPlumber());
            stream = self.constructStream(stream, configuration);
            stream = self.constructDestination(stream, gulp, TaskUtility.normaliseDestinationPath(pathConfiguration, lessConfiguration.destination));

            return stream;
        });

        return [TaskName.BUILD_LESS];
    }

    /**
     * @inheritDoc
     */
    public constructPipeline(configuration:Configuration):Pipeline {
        var [lessConfiguration, pathConfiguration]:Configuration = configuration;
        var plugins:any = lessConfiguration.plugins instanceof Function ? lessConfiguration.plugins : function () { return clone(lessConfiguration.plugins) };
        var index:number;

        (plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
        (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.LESS);
        (index = plugins.indexOf(Plugin.LESS)) >= 0 && plugins.splice(index, 1, less(), postcss([
            require('stylelint')({
                rules: {
                    "property-no-vendor-prefix": true,
                    "selector-no-vendor-prefix": true,
                    "value-no-vendor-prefix": true
                }
            }),
            require('postcss-discard-comments')({removeAll: true}),
            require('autoprefixer')({browsers: ['last 2 versions']}),
            require('cssnano')(),
            require('postcss-reporter')()
        ]));

        return this.pipelineStreams(plugins);
    }
}