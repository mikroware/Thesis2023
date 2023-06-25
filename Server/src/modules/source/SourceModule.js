import Module from '../Module'

export default class SourceModule extends Module {
    // TODO: consider making SourceShapeModule and SourceDataModule with preset statics
    static sourceType;

    constructor(...args) {
        super(...args);

        console.log('CLASS OF SOURCE MODULE ===== ', typeof (this), this.constructor.name);

        // if(!this.sourceType){
            // TODO: is it even needed to check this??
        // }
    }
}
