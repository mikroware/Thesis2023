import SourceModule from '../SourceModule'

export default class SourceNormalizeJson extends SourceModule {
    static type = 'json';
    static name = 'Normalize from JSON';

    static schema = require('./SourceNormalizeJson.json');

    static sourceType = 'data';

}
