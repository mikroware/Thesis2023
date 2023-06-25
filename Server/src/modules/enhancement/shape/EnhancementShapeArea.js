import Module from '../../Module'

// TODO: add special extension class to Module for enhancements
export default class EnhancementShapeArea extends Module {
    static type = 'area';
    static name = 'Shape area';

    static options = {
        name: 'string',
    };

    name;

    run(item, context){
        return 1;
    }
}
