import Module from '../../Module'

export default class VisualColorSingle extends Module {
    static type = 'single';
    static name = 'Single color';

    static schema = require('./VisualColorSingle.json');

    singleColor;

    run(){
        // [color, opacity]
        return [this.props.singleColor, 1];
    }
}
