import { MediaMetadata } from '../common/types/MediaMetadata';

export interface DataService {
    getMediaMetadata(prefixes: string[]): Promise<MediaMetadata>;
}
