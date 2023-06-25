import { path } from 'ramda'
import Validator from '../util/Validator'

const v = new Validator();

// TODO: consider constructing an entity as part of the processing pipeline
//  e.g. the pipeline is constructed from the config (only replaced on changes),
//  and each instance can determine if it wants to run or not (can depend on the processing step and the context)
//  ... OR is it up to the pipeline to determine to run or not?
//    Pipeline can only take broader decisions so might run heavy modules while only one had to run.. but it reduces complexity in the modules
export default class Module {
    /**
     * The unique type which defines this module, which is also configured in the schema as const
     * Should be unique for the category this module is in, generally uses the last part of the class name
     *
     * @type {string}
     */
    static type;

    /**
     * Readable and descriptive name of this module, this is presented to the user
     *
     * @type {string}
     */
    static name;

    /**
     * JSON V7 schema which defines the configurable options for this module
     *
     * @type {Schema}
     */
    static schema;

    /**
     * Defines if this module is immutable and thus does not touch the input data
     * If false, it is manipulating input data (which can be faster for big datasets)
     *
     * @type {boolean}
     */
    static isImmutable = false;

    /**
     * Holding the configuration for this module instance
     *
     * @readonly
     * @type {{}}
     */
    props = {};

    isChanged = false;

    /**
     * Dispatch function to send information to the main Application
     * @type {function}
     */
    dispatch = null;

    constructor(config, dispatch){
        // TODO: check if all statics are ok?

        // Load configuration in instance
        this.props = {
            ...config,
        };

        this.dispatch = dispatch;

        // TODO: check if Module depends on another source??
    }

    updateConfig(config){
        // TODO: replace/update the config and perform a check if it is changed
        //  .. set some isChanged variable which run() can use to change its behaviour
        //  .. should be reset after running (probably by the pipeline logic module handler)

        // This is probably NOT good as child class cannot see it maybe if defined in this class?.... fuck es6...
        this.isChanged = true;
    }

    /**
     *
     * @param item
     * @param {PipelineContext} context
     * @returns {any}
     */
    run(item, context){
        return null;
    }

    // TODO: implement more possibilities, perhaps reporting non-existing fields, etc
    getProperty(field, feature){
        field = field.split('.');

        if(field[0] === '$shapeProperties'){
            return path(field.slice(1), feature.properties);
        }

        return false;
    }

    static configure(currentConfig, patchConfig){
        if(!this.validate(patchConfig).valid){
            return false;
        }

        // Cannot spread and assign as it needs to be by reference
        Object.keys(patchConfig).forEach(key => {
            // Patch the option by reference
            currentConfig[key] = patchConfig[key];
        });

        return true;
    }

    static validate(instance){
        if(!this.schema) throw new Error(
            `Configurable of type '${this.type}' has no schema loaded. Cannot validate invalid Configurable.`
        );

        return v.validateModule(instance, this.schema);
    }
}
