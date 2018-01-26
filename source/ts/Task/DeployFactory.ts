import {AbstractFactory} from './Deploy/AbstractFactory';
import {AbstractTaskFactory} from './AbstractTaskFactory';
import {GulpHelp} from 'gulp-help';
import {S3Factory, S3Configuration} from './Deploy/S3Factory';
import {ParsedArgs} from 'minimist';
import {PathConfiguration} from '../Configuration/PathConfiguration';
import {Task as TaskName} from '../Constant/Task';
import {ConfigurationInterface} from '../Configuration/Configuration';

import sequence = require('run-sequence');

export type Configuration = [DeployConfiguration, PathConfiguration];

export interface DeployConfiguration extends ConfigurationInterface {
    s3?: S3Configuration;
}

export class DeployFactory extends AbstractTaskFactory {

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
        var parameters: ParsedArgs = this.parameters;
        var [deployConfiguration, pathConfiguration] = this.normaliseConfiguration(this.configuration, parameters);
        var gulp: GulpHelp = this.gulp;

        // Define available subtask factories by configuration key.

        var factories: { [id: string]: typeof AbstractFactory } = {
            s3: S3Factory
        };

        // 

        var options: { [id: string]: string } = {};
        var tasks: any[] = [];

        // Gulp help stuff.

        var description: string = 'Clean and build dependencies into local libraries.';

        options['production'] = 'Build for production, will minify and strip everything it can. Very slow… \uD83D\uDC22';
        options['watch'] = 'Watch files for changes to re-run.';

        Object.keys(deployConfiguration).forEach(function (key: string) {
            if (factories[key] == null) {
                return;
            }

            var factory: AbstractFactory = new (<any>factories[key])();

            factory.configuration = [deployConfiguration[key], pathConfiguration];
            factory.gulp = gulp;
            factory.options = options;
            factory.parameters = parameters;

            tasks.push(factory.construct());
        });

        gulp.task(TaskName.DEPLOY, description, function (callback) {
            if (tasks.length === 0) {
                throw new Error('No tasks were configured, make sure your configuration is correct.');
            } else {
                tasks.push(callback);
            }

            return sequence.use(gulp).apply(null, tasks);
        }, {options: options});
    }
}