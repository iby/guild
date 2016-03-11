/**
 * Task option description that's displayed in cli.
 */
export class Option {
    name:string;
    description:string;

    constructor(name:string, description:string) {
        this.name = name;
        this.description = description;
    }
}