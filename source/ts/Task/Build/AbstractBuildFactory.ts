import {AbstractSubtaskFactory} from '../AbstractSubtaskFactory';
import {BuildConfiguration} from '../../Configuration/GuildConfiguration';
import {Schema} from '../../Constant/Schema';

/**
 * Construction result tuple represents build, clean and watch task names constructed by the factory.
 */
export type Task = [string[], string[], string[]];

export abstract class AbstractBuildFactory extends AbstractSubtaskFactory {

    /**
     * @inheritDoc
     */
    public configuration:BuildConfiguration;

    /**
     * @inheritDoc
     */
    public construct():Task {

        // Basic prevalidation that we have everything that we need to start constructing the task.

        if (this.configuration == null) {
            throw new Error('Missing configuration in the task factory.');
        } else if (this.parameters == null) {
            throw new Error('Missing cli parameters in the task factory.');
        } else if (this.gulp == null) {
            throw new Error('Missing gulp instance reference in the task factory.');
        }

        this.validate(this.configuration, Schema.BUILD_LESS);

        return null;
    }
}