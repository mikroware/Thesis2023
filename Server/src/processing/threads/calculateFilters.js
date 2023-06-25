import { path } from 'ramda'

// TODO: these threads are now modules? Since the whole Pipeline now runs as one big thread

function run(workerData, done) {
    const data = workerData.data;
    const filters = workerData.filters;
    const sources = workerData.sources;
    if (!data || !filters) throw new Error('workerData must contain key `data` and `filters`');

    const filter = filters[0];

    function isVisible(properties, noDataValue) {
        const value = path(filter.field.split('.'), properties);

        // Ignore items without data
        if (value === noDataValue) return true;

        return Boolean(value) && value >= filter.range[0] && value <= filter.range[1];
    }

    const hide = {};

    if (filter) {
        data[filter.sourceIndex].data.forEach(dataSet => {
            if (!isVisible(dataSet.properties, sources[filter.sourceIndex].noDataValue)) {
                hide[dataSet.id] = true;
            }
        });
    }

    done({
        config: filter,
        hide,
    });
}

export const runCalculateFilters = (data) => {
    return new Promise((resolve, reject) => {
        run(data, resolve);
    });
};
