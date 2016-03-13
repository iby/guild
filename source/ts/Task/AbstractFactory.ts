import {GulpHelp} from 'gulp-help';
import {ParsedArgs} from 'minimist';
import {AbstractError} from '../Error/AbstractError';

export class NormaliseConfigurationError extends AbstractError {

    /**
     * @inheritDoc
     */
    constructor(message?:string) {
        super('Cannot normalise configuration.' + (message == null || message.length === 0 ? '' : ' ' + message));
    }
}

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
     * @param gulp
     * @param configuration
     * @param parameters
     */
    constructor(gulp?:GulpHelp, configuration?:any, parameters?:ParsedArgs) {
        this.gulp = gulp;
        this.configuration = configuration;
        this.parameters = parameters;
    }

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
    public abstract normaliseConfiguration(configuration:any):any;

    /**
     * Constructs the task and registers it with gulp.
     */
    public abstract construct():any;

}