
type Config = {
    loaded: boolean;
    verbose: boolean;
    dataSources: ConfigDataSource[];
}

type ConfigDataSource = {
    file: string;
    name: string;
    simplifyTolerance: number;
    enabled: boolean;
}

const defaultConfig = (merge: object): Config => ({
    loaded: false,
    verbose: false,
    dataSources: [],
    ...merge,
});

export default defaultConfig
