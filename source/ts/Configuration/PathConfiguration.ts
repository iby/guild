import path = require('path');

export class PathConfiguration {
    [key: string]: string;

    /**
     * Root folder of the project.
     */
    root:string;

    /**
     * Folder with all dependencies, like bower or npm.
     */
    dependency:string;

    /**
     * Documentation and documentation assets.
     */
    documentation:string;

    /**
     * Entrypoint for a webserver.
     */
    entrypoint:string;
    library:string;
    product:string;
    source:string;

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