import { Source } from '../common/types/Source';

export interface StorageService {
    saveSourcesConfig(data: Source[]): Promise<void>;
    updateGallery(data: Source[]): Promise<void>;
}
