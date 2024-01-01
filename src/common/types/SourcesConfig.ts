import { MediaType } from './MediaType';

export interface Source {
    url: string;
    type: MediaType;
}

export type SourcesConfig = Record<string, Source>;
