import Module from '../Module'

export default class SourceInputModule extends Module {
    /**
     * This module explicitly requires a changed state
     *
     * @abstract
     * @return {boolean}
     */
    getChanged(){
        return false;
    }
}
