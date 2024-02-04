import { MediaType } from './MediaType';

export interface Source {
    url: string;
    type: MediaType;
    prefix: string;
}

export type SourcesConfig = Record<string, Source>;
