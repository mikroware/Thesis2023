import Module from '../../Module'

// TODO: change and add other types, this is a placehodler for now

export default class VisualHeightHeight extends Module {
    static type = 'height';
    static name = 'Dynamic height';

    static options = {
        from: 'property',
    };

    from;

    run(item, context){
        return 1;
    }
}
