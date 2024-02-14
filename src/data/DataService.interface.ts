import { Source } from '../common/types/Source';

export interface DataService {
    getSources(): Promise<Source[]>;
}
