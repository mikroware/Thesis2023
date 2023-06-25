const defaultConfig = (merge) => ({
    loaded: false,
    verbose: false,
    dataSources: [],
    ...merge,
});

export default defaultConfig
