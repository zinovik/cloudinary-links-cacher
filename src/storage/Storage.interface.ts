import { Source } from '../common/types/Source';

export interface StorageService {
    getSources(): Promise<Source[]>;
    saveSourcesConfig(data: Source[]): Promise<void>;
    updateGallery(data: Source[]): Promise<void>;
}
