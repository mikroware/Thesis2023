import SourceModule from '../SourceModule'

export default class SourceNormalizeShapefile extends SourceModule {
    static type = 'shapefile';
    static name = 'Normalize from Shapefile';

    static schema = require('./SourceNormalizeShapefile.json');

    static sourceType = 'shape';
}
