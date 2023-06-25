import Module from '../Module'

class FilterRange extends Module {
    static type = 'range';
    static name = 'Filter range';
    static options = false;

    // TODO: improve, make probably FilterConfigurable class to extend
    static configure(currentConfig, patchConfig){
        if(patchConfig.field){
            currentConfig.field = patchConfig.field;
        }

        if(patchConfig.range && patchConfig.range.length === 2){
            currentConfig.range = patchConfig.range;
        }

        return true;
    }
}

export default FilterRange
