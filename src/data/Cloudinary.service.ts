import axios from 'axios';
import { DataService } from './DataService.interface';
import { MediaMetadata } from '../common/types/MediaMetadata';
import { MediaType } from '../common/types/MediaType';

interface CloudinaryResource {
    url: string;
    resource_type: MediaType;
}

export class CloudinaryService implements DataService {
    private Authorization: string;

    constructor(
        credentials: string,
        private readonly cloudinaryName: string,
        private readonly cloudinaryFolder: string
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
        return `https://api.cloudinary.com/v1_1/${
            this.cloudinaryName
        }/resources/${type}?prefix=${prefix}&type=upload&max_results=500${
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

    private async getPrefixSources(
        prefix: string
    ): Promise<MediaMetadata[string][]> {
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
                prefix: prefix.replace(`${this.cloudinaryFolder}/`, ''),
            }));
    }

    private async getPaths(): Promise<string[]> {
        const {
            data: { folders },
        }: { data: { folders: Array<{ name: string; path: string }> } } =
            await axios.get(
                `https://api.cloudinary.com/v1_1/${this.cloudinaryName}/folders/${this.cloudinaryFolder}`,
                {
                    headers: { Authorization: this.Authorization },
                }
            );

        return folders.map((folder) => folder.path);
    }

    async getMediaMetadata(): Promise<MediaMetadata> {
        const paths = await this.getPaths();

        const pathSources = await Promise.all(
            paths.map((path) => this.getPrefixSources(path))
        );

        paths.forEach((path, index) =>
            console.log(`${path}: ${pathSources[index].length}`)
        );

        const allPathsSources = pathSources.reduce(
            (acc, pathUrls) => [...acc, ...pathUrls],
            []
        );

        const mediaMetadata: MediaMetadata = {};
        allPathsSources.forEach((urlConfig) => {
            mediaMetadata[this.getFilename(urlConfig.url)] = urlConfig;
        });

        return mediaMetadata;
    }
}
