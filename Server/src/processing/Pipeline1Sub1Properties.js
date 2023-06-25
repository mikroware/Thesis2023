import fs from 'fs'
import { mapObjIndexed } from 'ramda'
import PipelineInterface from './PipelineInterface'

class Pipeline1Sub1Properties extends PipelineInterface {
    process = (data) => {
        return new Promise(resolve => {
            const propertiesList = data.Pipeline1DataSet.map((data, i) => {
                if(!data) return null;

                const noDataValue = this.config.dataSources[i].noDataValue;
                let properties = {};

                data.data.forEach(item => {
                    properties = {
                        ...properties,
                        ...mapObjIndexed((val, key) => {
                            if(!properties[key]) return {
                                min: val,
                                max: val,
                                amount: 1,
                            };

                            if(val === noDataValue) return {
                                min: properties[key].min,
                                max: properties[key].max,
                                amount: properties[key].amount + 1,
                            };

                            return {
                                min: Math.min(properties[key].min, val),
                                max: Math.max(properties[key].max, val),
                                amount: properties[key].amount + 1,
                            }
                        }, item.properties),
                    };
                });

                return properties;
            });

            resolve(propertiesList);
        });
    }

    postProcess = (data) => {
        return new Promise(resolve => {
            // Write the properties and meta data to a separate file
            data.Pipeline1DataSet.map((set, i) => {
                if(!set) return null;

                this.writeJsonFile(`data${i}Properties`, {
                    meta: this.getOwnData(data)[i],
                    data: set.data.reduce((obj, item) => {
                        obj[item.id] = item.properties;

                        return obj;
                    }, {}),
                });
            });

            this.app.store.dispatch({
                type: 'PROPERTIES_CHANGE',
                properties: this.getOwnData(data),
            });

            resolve(null);
        });
    }
}

export default Pipeline1Sub1Properties
