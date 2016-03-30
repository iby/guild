import {AbstractFactory, NormaliseConfigurationError} from './AbstractFactory';
import {GulpHelp} from 'gulp-help';
import {Gulp} from 'gulp';
import {Option} from './Option';
import {ReadWriteStream, Pipeline} from '../Stream/Pipeline';
import {Validator} from '../Validator/Validator';
import {NotImplementedError} from '../Error/NotImplementedError';

import del = require('del');
import merge = require("merge-stream");
import clone = require("clone");

export abstract class AbstractSubtaskFactory extends AbstractFactory {

    /**
     * Single schema validator.
     */
    protected static validator:Validator = new Validator();

    /**
     * Task-specific option, should be overridden by inheriting classes.
     */
    protected option:Option;

    /**
     * Already defined gulp task options, newly constructed task may add it's own options here.
     */
    public options:{[id:string]:string};

    /**
     * Constructs write stream using `gulp.dest` to given destination.
     */
    public constructDestination(stream:ReadWriteStream, gulp:Gulp, destination:string|string[]):ReadWriteStream {
        if (Array.isArray(destination)) {
            (<string[]>destination).forEach(function (destination:string) { stream = stream.pipe(gulp.dest(destination)); });
        } else {
            stream = stream.pipe(gulp.dest(<string>destination));
        }

        return stream;
    }

    /**
     * Constructs main task from the given configuration registering it with the gulp and returns the name of
     * all constructed tasks, normally just one.
     */
    public abstract constructTask(gulp:GulpHelp, configuration:any):string[];

    /**
     * Constructs the task stream, relies on `constructPipeline` method to construct the stream pipeline.
     */
    public constructStream(stream:ReadWriteStream, configuration:any):ReadWriteStream {
        var pipeline:Pipeline = this.constructPipeline(configuration);

        // Yes, pipeline may get not constructed, for example with build copy task, it would return something only
        // when custom plugins are provided.

        if (pipeline == null) {
            return stream;
        }

        var [head, tail]:Pipeline = pipeline;
        stream.pipe(head);
        return tail;
    }

    /**
     * Constructs task-specific stream pipeline, this being a standalone method allows easier testing of streams
     * without touching gulp internals.
     */
    public constructPipeline(configuration:any):Pipeline {
        throw new NotImplementedError();
    }

    /**
     * Constructs and registers new clean task.
     */
    public constructClean(gulp:GulpHelp, configuration:any):string[] {
        throw new NotImplementedError();
    }

    /**
     * Constructs and registers new watch task, invokes tasks specified in `tasks` array when files change.
     */
    public constructWatch(gulp:GulpHelp, configuration:any, tasks:string[]):string[] {
        throw new NotImplementedError();
    }

    /**
     * Normalises plugins and returns plugin generator function.
     */
    protected constructPlugins(plugins:any):any[] {
        if (plugins == null) {
            return [];
        } else if (Array.isArray(plugins)) {
            return clone(plugins);
        } else if (plugins instanceof Function && Array.isArray(plugins = plugins())) {
            return plugins;
        }

        throw new NormaliseConfigurationError('Plugins must be either an array or a function that returns array.');
    }

    /**
     * Pipes streams into a pipeline object, returns `null` when `streams` is not provided or empty.
     */
    protected pipelineStreams(streams:ReadWriteStream[]):Pipeline {
        if (streams == null || streams.length === 0) {
            return null;
        }

        var head:ReadWriteStream = null;
        var tail:ReadWriteStream = null;

        streams.forEach(function (value:ReadWriteStream) {
            if (head == null && tail == null) {
                head = tail = value;
            } else {
                tail = tail.pipe(value);
            }
        });

        return [head, tail];
    }

    /**
     * Validates configuration using the given schema.
     */
    protected validate(data:any, schema:string) {
        AbstractSubtaskFactory.validator.validate(data, schema, {throwError: true});
    }
}