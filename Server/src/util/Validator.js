import { Validator as JsonValidator } from 'jsonschema'

// Extra formats to add
const customFormats = {
    property: function(input) {
        return input === '$testProperty';
    },
};

// Extra schemas to add to the validator
const additionalSchemas = [
    require('../config/commonSchemas/Range.json'),
];

class Validator extends JsonValidator {
    constructor() {
        super();

        // Add the extra schema's
        additionalSchemas.forEach(/** @type {Schema} */ schema => {
            this.addSchema(schema, schema.id);
        });

        // Add the extra custom formatting
        this.customFormats = {
            ...this.customFormats,
            ...customFormats,
        };
    }

    validate(instance, schema, options, ctx) {
        return super.validate(instance, schema, {
            preValidateProperty: this.autoConversionHook,
            ...options,
        }, ctx);
    }

    /**
     * Intended to validate a single module
     *
     * @param instance {{}}
     * @param schema {Schema}
     * @returns {*}
     */
    validateModule(instance, schema) {
        return this.validate(instance, {
            ...schema,
            additionalProperties: false,
        }, {
            nestedErrors: true,
            allowUnknownAttributes: false,
        });
    }

    autoConversionHook = (instance, property, schema, options, ctx) => {
        const val = instance[property];

        // Skip nulls and undefined
        if(val === null || typeof val === 'undefined') return;

        // Convert number types
        if(schema.type === 'number'){
            instance[property] = parseFloat(val);
        }
    }
}

export default Validator
