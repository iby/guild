import {AbstractFactory, Task} from './Build/AbstractFactory';
import {AbstractTaskFactory} from './AbstractTaskFactory';
import {ConfigurationInterface} from '../Configuration/Configuration';
import {GulpHelp} from 'gulp-help';
import {LessConfiguration, LessFactory} from './Build/LessFactory';
import {ParsedArgs} from 'minimist';
import {PathConfiguration} from '../Configuration/PathConfiguration';
import {Task as TaskName} from '../Constant/Task';
import {TwigConfiguration, TwigFactory} from './Build/TwigFactory';
import {WebpackConfiguration, WebpackFactory} from './Build/WebpackFactory';
import {CopyFactory} from './Build/CopyFactory';
import sequence = require('run-sequence');

export type Configuration = [BuildConfiguration, PathConfiguration];

export interface BuildConfiguration extends ConfigurationInterface {
    less?: LessConfiguration;
    twig?: TwigConfiguration;
    webpack?: WebpackConfiguration;
}

export class BuildFactory extends AbstractTaskFactory {

    /**
     * @inheritDoc
     */
    public normaliseConfiguration(configuration: Configuration, parameters?: ParsedArgs): Configuration {
        return configuration;
    }

    /**
     * @inheritDoc
     */
    public construct() {
        let parameters: ParsedArgs = this.parameters;
        let configuration: Configuration = this.normaliseConfiguration(this.configuration, parameters);
        let [buildConfiguration, pathConfiguration] = configuration;
        let gulp: GulpHelp = this.gulp;
        let self: BuildFactory = this;

        // Define available subtask factories by configuration key.

        let factories: { [id: string]: typeof AbstractFactory } = {
            copy: CopyFactory,
            less: LessFactory,
            twig: TwigFactory,
            webpack: WebpackFactory
        };

        // Depending on configuration we may have clean tasks, which must be run before the actual build tasks. If we
        // have a watch option on cli, we must also construct watch tasks.

        let options: { [id: string]: string } = {};
        let buildTasks: string[] = [];
        let cleanTasks: string[] = [];
        let watchTasks: string[] = [];

        // Fixme: schema allows to pass path arrays, but this will fail when we join them. This must be handled separately.

        Object.keys(buildConfiguration).forEach(function (key: string) {
            if (factories[key] == null) {
                return;
            }

            let factory: AbstractFactory = new (<any>factories[key])();

            factory.name = 'build' + '-' + key;
            factory.configuration = [buildConfiguration[key], pathConfiguration];
            factory.gulp = gulp;
            factory.options = options;
            factory.parameters = parameters;

            let [builds, cleans, watches]: Task = factory.construct();

            buildTasks = buildTasks.concat(builds);
            cleanTasks = cleanTasks.concat(cleans);
            watchTasks = watchTasks.concat(watches);
        });

        // Gulp help stuff.

        let description: string = 'Clean and build target (js, css) sources, when no target is given, builds for everything.';

        options['production'] = 'Build for production, will minify and strip everything it can. Very slow… \uD83D\uDC22';
        options['watch'] = 'Watch files for changes to re-run.';

        gulp.task(TaskName.BUILD, description, function (callback: Function) {
            let tasks: any[] = [];

            cleanTasks.length > 0 && tasks.push(cleanTasks);
            buildTasks.length > 0 && tasks.push.apply(tasks, buildTasks);
            watchTasks.length > 0 && tasks.push.apply(tasks, watchTasks);

            if (tasks.length === 0) {
                throw new Error('No tasks were configured, make sure your configuration is correct.');
            } else {
                tasks.push(callback);
            }

            return sequence.use(gulp as any)(...tasks);
        }, {options: options});
    }
}