/**
 * Todo: this is all a little hack like it used to be in pure javascript. This work around might turn
 * todo: into mess into ES6, I didn't fully understand the problem there. Sorry future generations…
 */
export abstract class AbstractError extends Error {
    constructor(message?:string) {
        super(message);

        var error:Error = Error.apply(this, [message]);

        this.message = error.message;
        this.name = error.name;
        this.stack = error.stack;
    }
}