import {AbstractFactory} from './AbstractFactory';
import {GulpHelp} from 'gulp-help';
import {Gulp} from 'gulp';
import {Option} from './Option';
import {ReadWriteStream, ReadableStream, Pipeline} from '../Stream/Pipeline';
import {Validator} from '../Validator/Validator';

import del = require('del');
import merge = require("merge-stream");

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
    public constructStream(stream:ReadableStream, configuration:any):ReadWriteStream {
        var [head, tail]:Pipeline = this.constructPipeline(configuration);
        stream.pipe(head);
        return tail;
    }

    /**
     * Constructs task-specific stream pipeline, this being a standalone method allows easier testing of streams
     * without touching gulp internals.
     */
    public abstract constructPipeline(configuration:any):Pipeline;

    /**
     * Creates a new clean task and appends it to `cleanTasks` array.
     */
    protected constructClean(gulp:GulpHelp, name:string, path:string|string[]):string[] {
        gulp.task(name, false, function () { return del(path, {force: true}); });
        return [name];
    }

    /**
     * Creates and registers watch task.
     */
    protected constructWatch(gulp:GulpHelp, name:string, path:string|string[], tasks:string[]):string[] {
        gulp.task(name, false, function () { return gulp.watch(path, tasks); });
        return [name];
    }

    /**
     * Pipes streams into a pipeline object.
     */
    protected pipelineStreams(streams:ReadWriteStream[]):Pipeline {
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