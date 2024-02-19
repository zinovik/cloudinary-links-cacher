import axios from 'axios';
import { DataService } from './DataService.interface';
import { Source } from '../common/types/Source';
import { MediaType } from '../common/types/MediaType';

interface CloudinaryResource {
    url: string;
    resource_type: MediaType;
    folder: string;
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
        folder: string,
        type: MediaType,
        nextCursor: string
    ): string {
        return `https://api.cloudinary.com/v1_1/${
            this.cloudinaryName
        }/resources/${type}?prefix=${folder}&type=upload&max_results=500${
            nextCursor ? `&next_cursor=${nextCursor}` : ''
        }`;
    }

    private getFilename(url: string): string {
        return url.split('/').slice(-1)[0] || '';
    }

    private async getCloudinaryResources(
        folder: string,
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
                this.getCloudinaryUrl(folder, type, nextCursor),
                { headers: { Authorization: this.Authorization } }
            );

            resources.push(...data.resources);
            nextCursor = data.next_cursor;
        } while (nextCursor);

        return resources;
    }

    async getSources(): Promise<Source[]> {
        const [imageResources, videoResources] = await Promise.all([
            this.getCloudinaryResources(this.cloudinaryFolder, 'image'),
            this.getCloudinaryResources(this.cloudinaryFolder, 'video'),
        ]);

        return [...imageResources, ...videoResources]
            .map((resource) => ({
                url: resource.url.replace('http', 'https'),
                filename: this.getFilename(resource.url),
                folder: resource.folder.replace(
                    `${this.cloudinaryFolder}/`,
                    ''
                ),
            }))
            .sort((source1, source2) =>
                source1.filename.localeCompare(source2.filename)
            );
    }
}
