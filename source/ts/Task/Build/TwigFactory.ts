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
import twig = require('gulp-twig');

// Internal configuration format.

export type Configuration = [TwigConfiguration, PathConfiguration];

export interface TwigConfiguration extends ConfigurationInterface {
    clean?: boolean;
    data?: any;
    destination: string | string[];
    options?: any, // Todo: gulp-twig plugin options, ideally can be replaced with https://github.com/zimmen/gulp-twig/issues/25
    plugins?: PluginGenerator;
    source: string | string[];
    watch?: boolean | string | string[];
}

/**
 * Creates and registers twig build tasks.
 */
export class TwigFactory extends AbstractFactory {
    /**
     * @inheritDoc
     */
    public name: string = TaskName.BUILD_TWIG;
    /**
     * @inheritDoc
     */
    protected option: Option = new Option('twig', 'Build twig sources.');

    /**
     * @inheritDoc
     */
    public normaliseConfiguration(configuration: Configuration, parameters?: ParsedArgs): Configuration {
        let [twigConfiguration, pathConfiguration]: Configuration = configuration;

        // Options.

        let clean: boolean;
        let data: any;
        let destination: string | string[];
        let options: any;
        let plugins: PluginGenerator;
        let source: string | string[];
        let watch: boolean | string | string[];

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

        source == null && (source = 'twig');
        destination == null && (destination = 'html');
        plugins == null && (plugins = null);
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
    public construct(): Task {
        super.construct();

        let configuration: Configuration = this.normaliseConfiguration(this.configuration, this.parameters);
        let [twigConfiguration, pathConfiguration]: Configuration = configuration;
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
        let self: TwigFactory = this;

        gulp.task(TaskName.BUILD_TWIG, false, function () {
            let [twigConfiguration, pathConfiguration] = configuration;
            let stream: ReadWriteStream;

            stream = gulp.src(PathUtility.globalisePath(PathUtility.normaliseSourcePath(pathConfiguration, twigConfiguration.source), '**/*.twig')).pipe(self.constructPlumber());
            stream = self.constructStream(stream, twigConfiguration);
            stream = self.constructDestination(stream, gulp, PathUtility.normaliseDestinationPath(pathConfiguration, twigConfiguration.destination));

            return stream;
        });

        return [TaskName.BUILD_TWIG];
    }

    /**
     * @inheritDoc
     */
    public constructPipeline(configuration: TwigConfiguration): Pipeline {
        let plugins: any[] = this.constructPlugins(configuration.plugins);
        let index: number;

        (plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
        (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.TWIG);
        (index = plugins.indexOf(Plugin.TWIG)) >= 0 && plugins.splice(index, 1, twig(configuration.options));

        return this.pipelineStreams(plugins);
    }

    /**
     * @inheritDoc
     */
    public constructClean(gulp: GulpHelp, configuration: Configuration): string[] {
        let [twigConfiguration, pathConfiguration]: Configuration = configuration;
        let task: string;

        if (!twigConfiguration.clean) {
            return [];
        }

        gulp.task(task = this.name + '-clean', false, function () {
            let path: string | string[] = PathUtility.globalisePath(PathUtility.normaliseDestinationPath(pathConfiguration, twigConfiguration.destination), '**/*.html');
            return del(path, {force: true});
        });

        return [task];
    }

    /**
     * @inheritDoc
     */
    public constructWatch(gulp: GulpHelp, configuration: Configuration, tasks: string[]): string[] {
        let [twigConfiguration, pathConfiguration]: Configuration = configuration;
        let watch: any = twigConfiguration.watch;
        let task: string;

        if (watch === false) {
            return [];
        }

        gulp.task(task = this.name + '-watch', false, function () {

            // When no explicit watch paths are given, use default twig source location, otherwise normalise paths
            // relative to the root directory. Todo: must take into account `configuration.source`…

            let path: string | string[] = watch === true
                ? PathUtility.normaliseSourcePath(pathConfiguration, 'twig/**/*.twig')
                : PathUtility.normalisePath(pathConfiguration.root, watch);

            return gulp.watch(path, tasks as any);
        });

        return [task];
    }
}