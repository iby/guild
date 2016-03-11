import {AbstractFactory} from './AbstractFactory';
import {GuildConfiguration} from '../Configuration/GuildConfiguration';
import {GulpHelp} from 'gulp-help';
import {ParsedArgs} from 'minimist';

export abstract class AbstractTaskFactory extends AbstractFactory {

    /**
     * @inheritDoc
     */
    public configuration:GuildConfiguration;

    /**
     * @param gulp
     * @param configuration
     * @param parameters
     */
    constructor(gulp?:GulpHelp, configuration?:GuildConfiguration, parameters?:ParsedArgs) {
        super();

        this.gulp = gulp;
        this.configuration = configuration;
        this.parameters = parameters;
    }
}