import { ConfigSchema } from '../../configSchema'

export interface PipelineContextInvokeDetails {
    sourceChanged?: number;
}

export interface PipelineContextChanged {
    source?: {
        [i: number]: boolean;
    };
}

export interface PipelineContext {
    forceRerun: boolean;
    invokeDetails?: PipelineContextInvokeDetails;
    changed?: PipelineContextChanged;
    config: ConfigSchema;
}
