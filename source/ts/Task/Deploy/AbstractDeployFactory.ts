import {AbstractSubtaskFactory} from '../AbstractSubtaskFactory';

export type Task = string[]

export abstract class AbstractDeployFactory extends AbstractSubtaskFactory {

    /**
     * @inheritDoc
     */
    public abstract construct():Task;
}