import { MediaMetadata } from '../common/types/MediaMetadata';

export interface StorageService {
    saveSourcesConfig(data: MediaMetadata): Promise<void>;
    updateGallery(data: MediaMetadata): Promise<void>;
}
