'use strict';

// This is just a bunch of JSDoc definitions to help WebStorm with code inspections.

/**
 * @name GuildConfiguration
 * @property {BuildConfiguration} build
 * @property {DependencyConfiguration} dependency
 * @property {DeployConfiguration} deploy
 * @property {Path} path
 */

/**
 * @name BuildConfiguration
 * @property {LessConfiguration} less
 * @property {TwigConfiguration} twig
 * @property {WebpackConfiguration} webpack
 * @property {Path} path
 */

/**
 * @name DependencyConfiguration
 * @property {*} clean
 * @property {*} normalise
 * @property {Path} path
 */

/**
 * @name DeployConfiguration
 * @property {*} s3
 * @property {Path} path
 */

/**
 * @name LessConfiguration
 * @property {String} source
 * @property {String} destination
 * @property {Array} plugins
 * @property {Path} path
 */

/**
 * @name NormaliseTarget
 * @property {String} source
 * @property {String} destination
 * @property {Array} plugins
 */

/**
 * @name S3Target
 * @property {String} source
 * @property {String} plugins
 * @property {String} accessKey
 * @property {String} baseUrl
 * @property {String} certificateAuthority
 * @property {String} pathStyle
 * @property {String} region
 * @property {String} secretKey
 */

/**
 * @name TwigConfiguration
 * @property {String} source
 * @property {String} destination
 * @property {*} data
 * @property {Array} plugins
 * @property {Path} path
 */

/**
 * @name WebpackConfiguration
 * @property {String} source
 * @property {String} destination
 * @property {Object} configuration
 * @property {Array} plugins
 * @property {Path} path
 */
