import {AbstractError} from './AbstractError';

export class NotImplementedError extends AbstractError {

    /**
     * @inheritDoc
     */
    constructor(message?:string) {
        super(message == null ? 'The invoked block is not implemented… Y U CALL ME!!!' : message);
    }
}