import SourceModule from '../SourceModule'

export default class SourceNormalizeGeojson extends SourceModule {
    static type = 'geojson';
    static name = 'Normalize from GeoJSON';

    static schema = require('./SourceNormalizeGeojson.json');

    static sourceType = 'shape';

    run(item, context) {
        // TODO: implement
        return {
            todo: 'NormalizeGeojson',
            sourceData: item.sourceData,
        };
    }
}
