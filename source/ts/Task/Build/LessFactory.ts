import {AbstractFactory, Task} from './AbstractFactory';
import {ConfigurationInterface, PluginGenerator} from '../../Configuration/Configuration';
import {DataType} from '../../Constant/DataType';
import {GulpHelp} from 'gulp-help';
import {Option} from '../Option';
import {Parameter} from '../../Constant/Parameter';
import {ParsedArgs} from 'minimist';
import {PathConfiguration} from '../../Configuration/PathConfiguration';
import {PathUtility} from '../../Utility/PathUtility';
import {Pipeline, ReadWriteStream} from '../../Stream/Pipeline';
import {Plugin} from '../../Constant/Plugin';
import {Task as TaskName} from '../../Constant/Task';
import del = require('del');
import less = require('gulp-less');
import postcss = require('gulp-postcss');

// Internal configuration format.

export type Configuration = [LessConfiguration, PathConfiguration];

export interface LessConfiguration extends ConfigurationInterface {
    clean?: boolean;
    destination: string | string[];
    plugins?: PluginGenerator;
    source: string | string[];
    watch?: boolean | string | string[];
}

/**
 * Creates and registers less build tasks.
 */
export class LessFactory extends AbstractFactory {

    /**
     * @inheritDoc
     */
    public name: string = TaskName.BUILD_LESS;
    /**
     * @inheritDoc
     */
    protected option: Option = new Option('less', 'Build less sources.');

    /**
     * @inheritDoc
     */
    public normaliseConfiguration(configuration: Configuration, parameters?: ParsedArgs): Configuration {
        let [lessConfiguration, pathConfiguration]: Configuration = configuration;

        // Options.

        let clean: boolean;
        let destination: string | string[];
        let plugins: PluginGenerator;
        let source: string | string[];
        let watch: boolean | string | string[];

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
        plugins == null && (plugins = null);
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
    public construct(): Task {
        super.construct();

        let configuration: Configuration = this.normaliseConfiguration(this.configuration, this.parameters);
        let [lessConfiguration, pathConfiguration]: Configuration = configuration;
        let gulp: GulpHelp = this.gulp;
        let task: string[];

        return [
            task = this.constructTask(gulp, configuration),
            this.constructClean(gulp, configuration),
            this.constructWatch(gulp, configuration, task)
        ];
    }

    /**
     * @inheritDoc
     */
    public constructTask(gulp: GulpHelp, configuration: Configuration): string[] {
        let task: string = TaskName.BUILD_LESS;
        let self: LessFactory = this;

        gulp.task(task, false, function () {
            let [lessConfiguration, pathConfiguration]: Configuration = configuration;
            let stream: ReadWriteStream;

            stream = gulp.src(PathUtility.globalisePath(PathUtility.normaliseSourcePath(pathConfiguration, lessConfiguration.source), '**/*.less')).pipe(self.constructPlumber());
            stream = self.constructStream(stream, lessConfiguration);
            stream = self.constructDestination(stream, gulp, PathUtility.normaliseDestinationPath(pathConfiguration, lessConfiguration.destination));

            return stream;
        });

        return [task];
    }

    /**
     * @inheritDoc
     */
    public constructPipeline(configuration: LessConfiguration): Pipeline {
        let plugins: any[] = this.constructPlugins(configuration.plugins);
        let index: number;

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

    /**
     * @inheritDoc
     */
    public constructClean(gulp: GulpHelp, configuration: Configuration): string[] {
        let [lessConfiguration, pathConfiguration]: Configuration = configuration;
        let task: string;

        if (lessConfiguration.clean === false) {
            return [];
        }

        gulp.task(task = this.name + '-clean', false, function () {
            let path: string | string[] = PathUtility.globalisePath(PathUtility.normaliseDestinationPath(pathConfiguration, lessConfiguration.destination), '**/*.css');
            return del(path, {force: true});
        });

        return [task];
    }

    /**
     * @inheritDoc
     */
    public constructWatch(gulp: GulpHelp, configuration: Configuration, tasks: string[]): string[] {
        let [lessConfiguration, pathConfiguration]: Configuration = configuration;
        let watch: any = lessConfiguration.watch;
        let task: string;

        if (watch === false) {
            return [];
        }

        gulp.task(task = this.name + '-watch', false, function () {

            // When no explicit watch paths are given, use default less source location, otherwise normalise paths
            // relative to the root directory. Todo: must take into account `configuration.source`…

            let path: string | string[] = watch === true
                ? PathUtility.normaliseSourcePath(pathConfiguration, 'less/**/*.less')
                : PathUtility.normalisePath(pathConfiguration.root, watch);

            return gulp.watch(path, tasks as any);
        });

        return [task];
    }
}