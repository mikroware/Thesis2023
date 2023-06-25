const { path } = require('ramda');
const Lut = require('../../util/Lut');

let lut = null;

const makeValueFromType = (dataSet) => (type) => {
    // TODO: clean this up, check by visualize type as they all require different settings

    // {
    //     "type": "height", "visualize": "height",
    //     "from": "properties.AANT_INW", "scale": 0.0003, "round": true, "min": 2,
    //     "default": { "compare": ["smaller", 1], "value": 1 }
    // }
    if(type.from){
        let value = path(type.from.split('.'), dataSet.properties);
        if(!value) return type.min || value;

        if(type.default){
            if(type.default.compare[0] === 'smaller'){
                if(value < type.default.compare[1]){
                    return type.default.value;
                }
            }
        }

        if(type.scale || type.scale === 0) value = value * type.scale;
        if(type.round) value = Math.round(value);
        if(type.min && value < type.min) value = type.min;

        return value;
    }

    // {
    //     "type": "color", "visualize": "color",
    //     "compare": ["smaller", "properties.AANT_MAN", "properties.AANT_VROUW", "#55FF55", "#FF3439"]
    // }
    if(type.compare){
        let valueLeft = path(type.compare[1].split('.'), dataSet.properties);
        let valueRight = path(type.compare[2].split('.'), dataSet.properties);

        if(!valueLeft && !valueRight) return null;
        if(!valueLeft) return type.compare[4];
        if(!valueRight) return type.compare[3];

        if(type.compare[0] === 'smaller'){
            let value = valueLeft < valueRight ? type.compare[3] : type.compare[4];

            // TODO: temporary.. remove when possible in config
            if(dataSet.properties.AANT_INW < 1) value = '#a5e5ff';

            return value;
        }
    }

    if(type.visualize === 'color' && type.colorMap){
        const value = path(type.field.split('.'), dataSet.properties) || 0;

        if(type.specialMap){
            const special = type.specialMap.find(map => (
                map.from ? path(map.from.split('.'), dataSet.properties) === map.value : map.value === value
            ));

            if(special){
                return [special.to, type.opacity || 1];
            }
        }

        if(!lut){
            lut = new Lut(
                type.colorMap === true ? 'cooltowarm' : type.colorMap,
                type.hardMap ? 32 : 100,
                type.hardMap ? type.hardMap === true ? 0.5 : type.hardMap : undefined,
            );
            lut.setMin((type.range && type.range.min) || 0);
            lut.setMax((type.range && type.range.max) || 100);

            if(type.invert){
                lut.invertColorMap();
            }
        }

        return [`#${lut.getColor(value).getHexString()}`, type.opacity || 1];
    }

    if(type.visualize === 'color' && type.singleColor){
        return [`${type.singleColor}`, type.opacity || 1];
    }

    return undefined;
};

function run(workerData, done){
    const data = workerData.data;
    const visuals = workerData.visuals;
    if(!data || !visuals) throw new Error('workerData must contain key `data` and `visuals`');

    const types = visuals;
    lut = null; // Reset lut, should find a better solution

    const values = {};
    data.forEach(dataSet => {
        values[dataSet.id] = types.map(makeValueFromType(dataSet));
    });

    done({
        types,
        values,
    });
}

export const runCalculateVisuals = (data) => {
    return new Promise((resolve, reject) => {
        run(data, resolve);
    });
};
