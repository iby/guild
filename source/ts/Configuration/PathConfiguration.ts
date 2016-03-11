import path = require('path');

export class PathConfiguration {
    [key:string]:any;

    /**
     * Root folder of the project.
     */
    public root:string;

    /**
     * Folder with all dependencies, like bower or npm.
     */
    public dependency:string;

    /**
     * Documentation and documentation assets.
     */
    public documentation:string;

    /**
     * Entrypoint for a webserver.
     */
    public entrypoint:string;

    /**
     * Libraries that ship with the codebase.
     */
    public library:string;

    /**
     * Built products.
     */
    public product:string;

    /**
     * Source files.
     */
    public source:string;

    /**
     * Default destination location(s), when not specified guild would normally use `product` as
     * default. This is useful for cases when we need to build a product and put something into the
     * entrypoint to make it available for the webserver.
     */
    public destination:string|string[];

    constructor(root:string) {
        this.root = root;
        this.dependency = path.join(root, 'dependency');
        this.documentation = path.join(root, 'documentation');
        this.entrypoint = path.join(root, 'entrypoint');
        this.library = path.join(root, 'library');
        this.product = path.join(root, 'product');
        this.source = path.join(root, 'source');
    }
}