import {AbstractSubtaskFactory} from '../AbstractSubtaskFactory';

/**
 * Construction result tuple represents build, clean and watch task names constructed by the factory.
 */
export type Task = [string[], string[], string[]];

export abstract class AbstractFactory extends AbstractSubtaskFactory {

    /**
     * @inheritDoc
     */
    public construct(): Task {

        // Basic prevalidation that we have everything that we need to start constructing the task.

        if (this.configuration == null) {
            throw new Error('Missing configuration in the task factory.');
        } else if (this.parameters == null) {
            throw new Error('Missing cli parameters in the task factory.');
        } else if (this.gulp == null) {
            throw new Error('Missing gulp instance reference in the task factory.');
        }

        // Fixme: this.validate(this.configuration, Schema.BUILD_LESS);

        return null;
    }
}