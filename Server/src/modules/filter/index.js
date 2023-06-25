import { loadModules } from '../moduleUtils'
import single from './single'
import and from './and'

export default {
    ...loadModules('Filter'),

    single,
    and,
}
