import {AbstractFactory, Task} from './AbstractFactory';
import {DataType} from '../../Constant/DataType';
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
import del = require('del');
import less = require('gulp-less');
import postcss = require('gulp-postcss');

// Internal configuration format.

export type Configuration = [LessConfiguration, PathConfiguration];

export interface LessConfiguration extends ConfigurationInterface {
    clean?:boolean;
    destination:string|string[];
    plugins?:any[];
    source:string|string[];
    watch?:boolean|string|string[];
}

/**
 * Creates and registers less build tasks.
 */
export class LessFactory extends AbstractFactory {

    /**
     * @inheritDoc
     */
    protected option:Option = new Option('less', 'Build less sources.');

    /**
     * @inheritDoc
     */
    public normaliseConfiguration(configuration:Configuration, parameters?:ParsedArgs):Configuration {
        var [lessConfiguration, pathConfiguration]:Configuration = configuration;

        // Options.

        var clean:boolean;
        var destination:string|string[];
        var plugins:PluginGenerators;
        var source:string|string[];
        var watch:boolean|string|string[];

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
        watch == null && (watch = watch === true || parameters[Parameter.WATCH] === true);

        // Rebuild less configuration.

        lessConfiguration = <LessConfiguration>{
            clean: clean !== false,
            destination: destination,
            plugins: plugins,
            source: source,
            watch: watch
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
            this.constructClean(gulp, configuration),
            this.constructWatch(gulp, configuration, task)
        ];
    }

    /**
     * @inheritDoc
     */
    public constructTask(gulp:GulpHelp, configuration:Configuration):string[] {
        var task:string = TaskName.BUILD_LESS;
        var self:LessFactory = this;

        gulp.task(task, false, function () {
            var [lessConfiguration, pathConfiguration]:Configuration = configuration;
            var stream:ReadWriteStream;

            stream = gulp.src(PathUtility.globalisePath(PathUtility.normaliseSourcePath(pathConfiguration, lessConfiguration.source), '**/*.less')).pipe(self.constructPlumber());
            stream = self.constructStream(stream, configuration);
            stream = self.constructDestination(stream, gulp, PathUtility.normaliseDestinationPath(pathConfiguration, lessConfiguration.destination));

            return stream;
        });

        return [task];
    }

    /**
     * @inheritDoc
     */
    public constructClean(gulp:GulpHelp, configuration:Configuration):string[] {
        var [lessConfiguration, pathConfiguration]:Configuration = configuration;
        var clean:boolean = lessConfiguration.clean;
        var task:string = TaskName.BUILD_LESS_CLEAN;

        if (clean === true) {
            return [];
        }

        gulp.task(task, false, function () {
            var path:string|string[] = PathUtility.globalisePath(PathUtility.normaliseDestinationPath(pathConfiguration, lessConfiguration.destination), '**/*.css');
            return del(path, {force: true});
        });

        return [task];
    }

    /**
     * @inheritDoc
     */
    public constructWatch(gulp:GulpHelp, configuration:Configuration, tasks:string[]):string[] {
        var [lessConfiguration, pathConfiguration]:Configuration = configuration;
        var task:string = TaskName.BUILD_LESS_WATCH;
        var watch:any = lessConfiguration.watch;

        if (watch === false) {
            return [];
        }

        gulp.task(task, false, function () {

            // When no explicit watch paths are given, use default less source location, otherwise normalise paths
            // relative to the root directory. Todo: must take into account `configuration.source`…

            var path:string|string[] = watch === true
                ? PathUtility.normaliseSourcePath(pathConfiguration, 'less/**/*.less')
                : PathUtility.normalisePath(pathConfiguration.root, watch);

            return gulp.watch(path, tasks);
        });

        return [task];
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