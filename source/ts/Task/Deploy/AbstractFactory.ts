import {AbstractSubtaskFactory} from '../AbstractSubtaskFactory';

export type Task = string[]

export abstract class AbstractFactory extends AbstractSubtaskFactory {

    /**
     * @inheritDoc
     */
    public abstract construct():Task;
}