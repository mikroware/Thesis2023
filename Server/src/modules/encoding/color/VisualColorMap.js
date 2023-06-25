import memoizeOne from 'memoize-one'
import Module from '../../Module'
import Lut from '../../../util/Lut'

function generateLut(colorMap, hardMap, rangeMin, rangeMax, invert){
    const lut = new Lut(
        colorMap === true ? 'cooltowarm' : colorMap,
        hardMap ? 32 : 100,
        hardMap ? hardMap === true ? 0.5 : hardMap : undefined,
    );

    lut.setMin((rangeMin) || 0);
    lut.setMax((rangeMax) || 100);

    if(invert) lut.invertColorMap();

    return lut;
}

export default class VisualColorMap extends Module {
    static type = 'map';
    static name = 'Color map';

    static schema = require('./VisualColorMap.json');

    // Local memoized function to create a lut for this module setting
    createLut = memoizeOne(generateLut);

    constructor(props) {
        super(props);

        this.lut = this.createLut(
            this.props.colorMap,
            this.props.hardMap,
            this.props.range && this.props.range.min,
            this.props.range && this.props.range.max,
            this.props.invert
        );
    }

    run(item, context){
        const value = this.getProperty(this.props.field, item) || 0;

        // [color, opacity]
        return [`#${this.lut.getColor(value).getHexString()}`, 1];
    }
}
