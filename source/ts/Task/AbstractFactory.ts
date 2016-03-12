import {GulpHelp} from 'gulp-help';
import {ParsedArgs} from 'minimist';

export abstract class AbstractFactory {

    /**
     * Factory/task-specific configuration that will be used during the construction, inheriting
     * methods should redefine this with a more appropriate type.
     */
    public configuration:any;

    /**
     * Gulp-help plugin instance, which will be updated with the tasks during the construction.
     */
    public gulp:GulpHelp;

    /**
     * Parameters received on the cli in case some are needed during the task construction.
     */
    public parameters:ParsedArgs;

    /**
     * Constructs a new instance of class this gets called on.
     */
    public static construct(...args:any[]):AbstractFactory {
        return new (<any>this)(...args);
    }

    /**
     * Often the configuration may vary from a simple boolean to a complex object, this method attempts
     * to take whatever value is available and normalise it to a point where it can be safely used without
     * worrying about alternative variations.
     */
    protected abstract normaliseConfiguration(configuration:any, parameters:ParsedArgs):any;

    /**
     * Constructs the task and registers it with gulp.
     */
    public abstract construct():any;

}