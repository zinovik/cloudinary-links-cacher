import { Bucket, Storage, File } from '@google-cloud/storage';
import { StorageService } from './Storage.interface';
import { Source } from '../common/types/Source';

const PUBLIC_URL = 'https://storage.googleapis.com/zinovik-gallery';

export class GoogleStorageService implements StorageService {
    private readonly bucket: Bucket;

    constructor(
        private readonly bucketName: string,
        private readonly sourceConfigFileName: string
    ) {
        const storage = new Storage();
        this.bucket = storage.bucket(this.bucketName);
    }

    async getSources(isPublic?: boolean): Promise<Source[]> {
        const [files] = await this.bucket.getFiles();

        return await Promise.all(
            files
                .filter((file) => file.name.includes('/'))
                .map(async (file) => {
                    const [folder, filename] = file.name.split('/');

                    const url = isPublic
                        ? `${PUBLIC_URL}/${file.name}`
                        : (
                              await this.bucket.file(file.name).getSignedUrl({
                                  version: 'v4',
                                  action: 'read',
                                  expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
                              })
                          )[0];

                    return {
                        url,
                        folder,
                        filename,
                    };
                })
        );
    }

    async saveSourcesConfig(sources: Source[]): Promise<void> {
        const file: File = this.bucket.file(this.sourceConfigFileName);

        const sourceConfig: Record<string, string> = {};
        sources.forEach((source) => {
            sourceConfig[source.filename] = source.url;
        });

        const dataBuffer = Buffer.from(JSON.stringify(sourceConfig));

        await file.save(dataBuffer, {
            gzip: true,
            public: false,
            resumable: true,
            contentType: 'application/json',
            metadata: {
                cacheControl: 'no-cache',
            },
        });
    }
}
