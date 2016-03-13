/**
 * Can and probably should be used as a base interface for all configurations.
 */
export interface ConfigurationInterface {
    [key:string]:any;
}

/**
 * Many configurations allow to specify plugins, they are either a list of predefined constants, which
 * certain factories understand and turn into streams themselves, or a function, which called every
 * time when the task is run and returns a list streams that can be also mixed with constants. Todo: we
 * todo: probably should use a more prominent return type, like `(WritableStream|string)[]`
 */
export type PluginGenerator = () => any[]

/**
 * A set / array of plugins, see `PluginGenerator` type.
 */
export type PluginGenerators = (string|PluginGenerator)[]