import { Source } from '../common/types/Source';

export interface StorageService {
    getSources(isPublic?: boolean): Promise<Source[]>;
    saveSourcesConfig(data: Source[]): Promise<void>;
    updateGallery(data: Source[]): Promise<void>;
}
