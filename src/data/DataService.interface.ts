import { SourcesConfig } from '../common/types/SourcesConfig';

export interface DataService {
    getSourcesConfig(): Promise<SourcesConfig>;
}
