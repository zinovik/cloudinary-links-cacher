import { MediaMetadata } from '../common/types/MediaMetadata';

export interface DataService {
    getMediaMetadata(): Promise<MediaMetadata>;
}
