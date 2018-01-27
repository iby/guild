declare module 'gulp-awspublish' {
    import {Writable} from 'stream';

    export interface Publisher {
        publish(headers:any, options:any):Writable;
    }

    export function reporter(param:any):Writable;
    export function create(options:any):Publisher;
}

declare module 'gulp-postcss' {
    function postcss(options:any):any;
    export = postcss;
}

declare module 'gulp-twig' {
    function twig(options:any):any;
    export = twig;
}