import axios from 'axios';
import { DataService } from './DataService.interface';
import { Source, SourcesConfig } from '../common/types/SourcesConfig';
import { MediaType } from '../common/types/MediaType';

interface CloudinaryResource {
    url: string;
    resource_type: MediaType;
}

export class CloudinaryService implements DataService {
    private Authorization: string;

    constructor(
        credentials: string,
        private readonly prefixes: string[],
        private readonly prefixStart: string
    ) {
        this.Authorization = `Basic ${Buffer.from(credentials).toString(
            'base64'
        )}`;
    }

    private getCloudinaryUrl(
        prefix: string,
        type: MediaType,
        nextCursor: string
    ): string {
        return `https://api.cloudinary.com/v1_1/zinovik/resources/${type}?prefix=${prefix}&type=upload&max_results=500${
            nextCursor ? `&next_cursor=${nextCursor}` : ''
        }`;
    }

    private getFilename(url: string): string {
        return url.split('/').slice(-1)[0] || '';
    }

    private async getCloudinaryResources(
        prefix: string,
        type: MediaType
    ): Promise<CloudinaryResource[]> {
        const resources: CloudinaryResource[] = [];
        let nextCursor;

        do {
            const {
                data,
            }: {
                data: { resources: CloudinaryResource[]; next_cursor: string };
            } = await axios.get(
                this.getCloudinaryUrl(prefix, type, nextCursor),
                { headers: { Authorization: this.Authorization } }
            );

            resources.push(...data.resources);
            nextCursor = data.next_cursor;
        } while (nextCursor);

        return resources;
    }

    private async getPrefixSources(prefix: string): Promise<Source[]> {
        const [imageResources, videoResources] = await Promise.all([
            this.getCloudinaryResources(prefix, 'image'),
            this.getCloudinaryResources(prefix, 'video'),
        ]);

        return [...imageResources, ...videoResources]
            .sort((resource1, resource2) =>
                this.getFilename(resource1.url).localeCompare(
                    this.getFilename(resource2.url)
                )
            )
            .map((resource) => ({
                url: resource.url.replace('http', 'https'),
                type: resource.resource_type,
                prefix: prefix.replace(this.prefixStart, ''),
            }));
    }

    async getSourcesConfig(): Promise<SourcesConfig> {
        const prefixSources = await Promise.all(
            this.prefixes.map((prefix) =>
                this.getPrefixSources(`${this.prefixStart}${prefix}`)
            )
        );

        this.prefixes.forEach((prefix, index) =>
            console.log(`${prefix}: ${prefixSources[index].length}`)
        );

        const allPrefixSources = prefixSources.reduce(
            (acc, prefixUrls) => [...acc, ...prefixUrls],
            []
        );

        const sourcesConfig: SourcesConfig = {};
        allPrefixSources.forEach((urlConfig) => {
            sourcesConfig[this.getFilename(urlConfig.url)] = urlConfig;
        });

        return sourcesConfig;
    }
}
