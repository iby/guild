import {AbstractSubtaskFactory} from '../AbstractSubtaskFactory';

export type Task = string[]

export abstract class AbstractDependencyFactory extends AbstractSubtaskFactory {

    /**
     * @inheritDoc
     */
    public abstract construct():Task;
}