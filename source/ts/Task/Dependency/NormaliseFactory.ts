import {AbstractFactory, Task} from './AbstractFactory';
import {ConfigurationInterface, PluginGenerator} from '../../Configuration/Configuration';
import {DataType} from '../../Constant/DataType';
import {GulpHelp} from 'gulp-help';
import {NormaliseConfigurationError} from '../AbstractFactory';
import {Option} from '../Option';
import {ParsedArgs} from 'minimist';
import {PathConfiguration} from '../../Configuration/PathConfiguration';
import {PathUtility} from '../../Utility/PathUtility';
import {Pipeline, ReadWriteStream} from '../../Stream/Pipeline';
import {Plugin} from '../../Constant/Plugin';
import {Task as TaskName} from '../../Constant/Task';
import concat = require('gulp-concat');
import gulpif = require('gulp-if');
import merge = require('merge-stream');
import path = require('path');
import uglify = require('gulp-uglify');

export type Configuration = [NormaliseConfiguration, PathConfiguration];
export type Configurations = [NormaliseConfiguration[], PathConfiguration];

export interface NormaliseConfiguration extends ConfigurationInterface {
    destination: string | string[];
    plugins?: PluginGenerator;
    source: string | string[];
}

export class NormaliseFactory extends AbstractFactory {

    /**
     * @inheritDoc
     */
    protected option: Option = new Option('normalise', 'Normalise dependencies.');

    /**
     * @inheritDoc
     */
    public normaliseConfigurations(configuration: Configuration, parameters: ParsedArgs): Configurations {
        let [normaliseConfiguration, pathConfiguration]: Configuration = configuration;
        let normaliseConfigurations: NormaliseConfiguration[] = [];
        let self: NormaliseFactory = this;

        let array: boolean = Array.isArray(normaliseConfiguration);
        let object: boolean = typeof normaliseConfiguration === DataType.OBJECT;

        if (!array && !object) {
            throw new NormaliseConfigurationError('Expecting either an object or array, received something totally different.');
        } else if (array) {
            normaliseConfigurations = (<any[]><any>normaliseConfiguration).map(function (configuration: NormaliseConfiguration) {
                return self.normaliseConfiguration([configuration, pathConfiguration]);
            });
        } else {
            normaliseConfigurations = Object.keys(normaliseConfiguration).map(function (key: string) {
                let configuration: NormaliseConfiguration;
                let source: string;
                let destination: string;

                // If configuration is already an object, we inject destination into it if necessary. If not,
                // we turn it into object. In both cases some normalisation takes place.

                let array: boolean = Array.isArray(normaliseConfiguration[key]);
                let object: boolean = typeof normaliseConfiguration[key] === DataType.OBJECT;

                if (array && object || !array && !object) {
                    configuration = {destination: key, source: normaliseConfiguration[key]};
                    source = normaliseConfiguration[key];
                    destination = key;
                } else {
                    configuration = normaliseConfiguration[key];
                    source = <string>configuration.source;
                    destination = configuration.destination == null ? key : null;
                }

                // Quick source validate.

                if (source == null) {
                    throw new Error('Missing source configuration.');
                }

                // If destination is not null, it means we must check and assign it. We get here when destination
                // is defined via key, i.e., not explicitly.

                if (destination != null && source != null) {

                    // Todo: this needs a very good think on how to reorganise this + it all must be done in the build
                    // todo: stream method, configuration should also have extra options.

                    // let basename:string;
                    // let filename:string;
                    // let extension:string;
                    // path.isAbsolute(destination) || TaskUtility.doesPathConfigurationExist(pathConfiguration, 'library') && (destination = pathConfiguration.library);

                    configuration.destination = destination;
                } else if (destination !== null) {
                    throw new Error('Missing destination configuration.');
                }

                return self.normaliseConfiguration([configuration, pathConfiguration]);
            });
        }

        return [normaliseConfigurations, pathConfiguration];
    }

    /**
     * @inheritDoc
     */
    public normaliseConfiguration(configuration: Configuration): NormaliseConfiguration {
        let [normaliseConfiguration, pathConfiguration]: Configuration = configuration;

        let source: string | string[] = normaliseConfiguration.source;
        let destination: string | string[] = normaliseConfiguration.destination;
        let plugins: PluginGenerator = normaliseConfiguration.plugins;

        // Todo: why are we doing path normalisation here?

        source = PathUtility.normaliseDependencyPath(pathConfiguration, source);
        destination = PathUtility.normaliseLibraryPath(pathConfiguration, destination);
        plugins == null && (plugins = null);

        let extension: string;
        let directory: string;
        let basename: string;

        // If destination has no extension, but source does…

        if ((extension = PathUtility.getCommonExtension(destination)) == null) {
            if ((extension = PathUtility.getCommonExtension(source)) != null) {
                destination += '.' + extension;
            }
        }

        // IMPORTANT, extension comes from the above operation.

        if (extension != null && !Array.isArray(destination) && (basename = path.basename(directory = path.dirname(<string>destination))) !== '' && basename !== '.' && basename !== extension) {
            destination = path.join(directory, extension, path.basename(<string>destination));
        }

        return {
            destination: destination,
            plugins: plugins,
            source: source
        };
    }

    /**
     * @inheritDoc
     */
    public constructTask(gulp: GulpHelp, configuration: Configurations): string[] {
        let self: NormaliseFactory = this;

        gulp.task(TaskName.DEPENDENCY_NORMALISE, false, function () {
            let [normaliseConfigurations, pathConfiguration]: Configurations = configuration;
            let streams: ReadWriteStream[] = [];

            for (let normaliseConfiguration of normaliseConfigurations) {
                let stream: ReadWriteStream;

                // We rename file inside the task, otherwise we'll end up with same destination
                // folder name as the filename.

                stream = gulp.src(normaliseConfiguration.source).pipe(self.constructPlumber());
                stream = self.constructStream(stream, normaliseConfiguration);
                stream = self.constructDestination(stream, gulp, PathUtility.getDirectory(normaliseConfiguration.destination));

                streams.push(stream);
            }

            return merge(...streams);
        });

        return [TaskName.DEPENDENCY_NORMALISE];
    }

    /**
     * @inheritDoc
     */
    public constructPipeline(configuration: NormaliseConfiguration): Pipeline {
        let plugins: any = this.constructPlugins(configuration.plugins);
        let index: number;

        (plugins == null || plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
        (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.NORMALISE);
        (index = plugins.indexOf(Plugin.NORMALISE)) >= 0 && plugins.splice(index, 1,

            // Uglify if dealing with js files.
            gulpif(/.*\.js/, uglify()),

            // Just in case concat everything and output as a single file at a single
            // location, event if there's only one file, we still want to rename it.
            concat(path.basename(<string>configuration.destination))
        );

        return this.pipelineStreams(plugins);
    }

    /**
     * @inheritDoc
     */
    public construct(): Task {
        let configuration: Configurations = this.normaliseConfigurations(this.configuration, this.parameters);
        let [normaliseConfiguration, pathConfiguration]: Configurations = configuration;
        let gulp: GulpHelp = this.gulp;

        return this.constructTask(gulp, configuration)
    }
}