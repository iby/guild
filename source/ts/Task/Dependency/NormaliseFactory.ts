import {AbstractDependencyFactory, Task} from './AbstractDependencyFactory';
import {DataType} from '../../Constant/DataType';
import {GulpHelp} from 'gulp-help';
import {NormaliseConfiguration, DependencyConfiguration} from '../../Configuration/GuildConfiguration';
import {Option} from '../Option';
import {ParsedArgs} from 'minimist';
import {PathConfiguration} from '../../Configuration/PathConfiguration';
import {Pipeline, ReadWriteStream} from '../../Stream/Pipeline';
import {Plugin} from '../../Constant/Plugin';
import {Task as TaskName} from '../../Constant/Task';
import {TaskUtility} from '../../Utility/TaskUtility';

import clone = require("clone");
import concat = require('gulp-concat');
import gulpif = require('gulp-if');
import merge = require('merge-stream');
import path = require('path');
import uglify = require('gulp-uglify');
import rename = require("gulp-rename");

export type Configuration = [NormaliseConfiguration, PathConfiguration];
export type Configurations = [NormaliseConfiguration[], PathConfiguration];

export class NormaliseFactory extends AbstractDependencyFactory {

    /**
     * @inheritDoc
     */
    protected option:Option = new Option('normalise', 'Normalise dependencies.');

    /**
     * @inheritDoc
     */
    public normaliseConfigurations(configuration:DependencyConfiguration, parameters:ParsedArgs):Configurations {
        var normaliseConfiguration:NormaliseConfiguration = configuration.normalise;
        var pathConfiguration:PathConfiguration = configuration.path;
        var normaliseConfigurations:NormaliseConfiguration[] = [];
        var self:NormaliseFactory = this;

        if (Array.isArray(normaliseConfiguration)) {
            normaliseConfiguration.forEach(function (configuration:NormaliseConfiguration) {
                normaliseConfigurations = normaliseConfigurations.concat(self.normaliseConfiguration([configuration, pathConfiguration]));
            });
        } else if (typeof normaliseConfiguration === DataType.OBJECT) {
            Object.keys(normaliseConfiguration).forEach(function (key:string) {
                var configuration:NormaliseConfiguration;
                var source:string;
                var destination:string;

                // If configuration is already an object, we inject destination into it if necessary. If not,
                // we turn it into object. In both cases some normalisation takes place.

                if (typeof normaliseConfiguration[key] === DataType.OBJECT) {
                    configuration = normaliseConfiguration[key];
                    source = <string>configuration.source;
                    destination = configuration.destination == null ? key : null;
                } else {
                    configuration = {source: normaliseConfiguration[key]};
                    source = normaliseConfiguration[key];
                    destination = key;
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

                    // var basename:string;
                    // var filename:string;
                    // var extension:string;
                    // path.isAbsolute(destination) || TaskUtility.doesPathConfigurationExist(pathConfiguration, 'library') && (destination = pathConfiguration.library);

                    configuration.destination = destination;
                } else if (destination !== null) {
                    throw new Error('Missing destination configuration.');
                }

                normaliseConfigurations.push(self.normaliseConfiguration([configuration, pathConfiguration]));
            });
        } else {
            throw new Error('Cannot normalise configuration.')
        }

        return [normaliseConfigurations, pathConfiguration];
    }

    /**
     * @inheritDoc
     */
    public normaliseConfiguration(configuration:Configuration):NormaliseConfiguration {
        var [normaliseConfiguration, pathConfiguration]:Configuration = configuration;

        var source:string|string[] = normaliseConfiguration.source;
        var destination:string|string[] = normaliseConfiguration.destination;
        var plugins:any[] = <any[]>normaliseConfiguration.plugins;

        source = TaskUtility.normaliseDependencyPath(pathConfiguration, source);
        destination = TaskUtility.normaliseLibraryPath(pathConfiguration, destination);

        var extension:string;
        var directory:string;
        var basename:string;

        // If destination has no extension, but source does…

        if ((extension = TaskUtility.getCommonExtension(destination)) == null) {
            if ((extension = TaskUtility.getCommonExtension(source)) != null) {
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
    public constructTask(gulp:GulpHelp, configuration:Configurations):string[] {
        var self:NormaliseFactory = this;

        gulp.task(TaskName.DEPENDENCY_NORMALISE, false, function () {
            var [normaliseConfigurations, pathConfiguration]:Configurations = configuration;
            var streams:ReadWriteStream[] = [];

            for (let normaliseConfiguration of normaliseConfigurations) {
                var stream:ReadWriteStream;

                // We rename file inside the task, otherwise we'll end up with same destination
                // folder name as the filename.

                stream = gulp.src(normaliseConfiguration.source).pipe(TaskUtility.createPlumber());
                stream = self.constructStream(stream, normaliseConfiguration);
                stream = self.constructDestination(stream, gulp, TaskUtility.getDirectory(normaliseConfiguration.destination));

                streams.push(stream);
            }

            return merge(...streams);
        });

        return [TaskName.DEPENDENCY_NORMALISE];
    }

    /**
     * @inheritDoc
     */
    public constructPipeline(configuration:NormaliseConfiguration):Pipeline {
        var plugins:any = configuration.plugins instanceof Function ? configuration.plugins : function () { return clone(configuration.plugins) };
        var index:number;

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
    public construct():Task {
        var configuration:Configurations = this.normaliseConfigurations(this.configuration, this.parameters);
        var [normaliseConfiguration, pathConfiguration]:Configurations = configuration;
        var gulp:GulpHelp = this.gulp;

        return this.constructTask(gulp, configuration)
    }
}