import { Bucket, Storage, File } from '@google-cloud/storage';
import { StorageService } from './Storage.interface';
import { Source } from '../common/types/Source';

const PUBLIC_URL = 'https://storage.googleapis.com/zinovik-gallery';

interface AlbumInterface {
    path: string;
    title: string;
    text?: string | string[];
    isSorted?: true;
}

interface FileInterface {
    path: string;
    filename: string;
    isTitle?: true;
    isNoThumbnail?: true;
    description: string;
    text?: string | string[];
    isVertical?: true;
}

export class GoogleStorageService implements StorageService {
    private readonly bucket: Bucket;

    constructor(
        private readonly bucketName: string,
        private readonly sourceConfigFileName: string,
        private readonly filesFileName: string,
        private readonly albumsFileName: string
    ) {
        const storage = new Storage();
        this.bucket = storage.bucket(this.bucketName);
    }

    async getSources(): Promise<Source[]> {
        const [files] = await this.bucket.getFiles();

        return files
            .map((file) => {
                const [folder, filename] = file.name.split('/');

                return {
                    url: `${PUBLIC_URL}/${file.name}`,
                    folder,
                    filename,
                };
            })
            .filter((file) => file.filename);
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
            public: true,
            resumable: true,
            contentType: 'application/json',
            metadata: {
                cacheControl: 'no-cache',
            },
        });
    }

    async updateGallery(sources: Source[]): Promise<void> {
        const filesFile: File = this.bucket.file(this.filesFileName);
        const albumsFile: File = this.bucket.file(this.albumsFileName);

        const [filesDownloadResponse, albumsDownloadResponse] =
            await Promise.all([filesFile.download(), albumsFile.download()]);

        const files: FileInterface[] = JSON.parse(
            filesDownloadResponse.toString()
        );

        let albums: AlbumInterface[] = JSON.parse(
            albumsDownloadResponse.toString()
        );

        const newSources = sources.filter(
            (source) => !files.some((file) => file.filename === source.filename)
        );

        console.log(
            'NEW FILENAMES:',
            newSources.map((source) => source.filename).join(', ')
        );

        if (newSources.length > 0) {
            files.push(
                ...newSources.map((source) => ({
                    path: `${source.folder}/unsorted`,
                    filename: source.filename,
                    description: '',
                }))
            );
        }

        const newPaths = [
            ...new Set(
                files
                    .filter(
                        (file) =>
                            !albums.some((album) => album.path === file.path)
                    )
                    .map((file) => file.path)
            ),
        ];

        console.log('NEW PATHS:', newPaths.join(', '));

        if (newPaths.length > 0) {
            albums.push(
                ...newPaths.map((path) => {
                    const [_, ...parts] = path.split('/');

                    return {
                        title: parts.join('/'),
                        path,
                    };
                })
            );
        }

        await Promise.all([
            (() => {
                const filesDataBuffer = Buffer.from(
                    JSON.stringify(this.sortFiles(files, albums))
                );

                return filesFile.save(filesDataBuffer, {
                    gzip: true,
                    public: false,
                    resumable: true,
                    contentType: 'application/json',
                    metadata: {
                        cacheControl: 'no-cache',
                    },
                });
            })(),
            (() => {
                const albumsDataBuffer = Buffer.from(
                    JSON.stringify(this.sortAlbums(albums))
                );

                return albumsFile.save(albumsDataBuffer, {
                    gzip: true,
                    public: true,
                    resumable: true,
                    contentType: 'application/json',
                    metadata: {
                        cacheControl: 'no-cache',
                    },
                });
            })(),
        ]);
    }

    private sortAlbums(albums: AlbumInterface[]): AlbumInterface[] {
        const sortedAlbums = albums
            .filter((album) => album.isSorted)
            .map((album) => album.path);

        const topLevelAlbums = albums
            .filter((album) => album.path.split('/').length === 1)
            .map((album) => album.path);

        return [...albums].sort((a1, a2) => {
            const a1PathParts = a1.path.split('/');
            const a2PathParts = a2.path.split('/');

            if (a1PathParts.length === 1 && a2PathParts.length === 1) {
                return 0;
            }

            if (a1PathParts[0] !== a2PathParts[0]) {
                return (
                    topLevelAlbums.indexOf(a1PathParts[0]) -
                    topLevelAlbums.indexOf(a2PathParts[0])
                );
            }

            // the same root path

            // is sorted album
            if (sortedAlbums.includes(a1PathParts[0])) {
                if (a1PathParts.length === a2PathParts.length)
                    return a1.path.localeCompare(a2.path);

                const minPathParts = Math.min(
                    a1PathParts.length,
                    a2PathParts.length
                );

                for (let i = 0; i < minPathParts; i++) {
                    if (a1PathParts[i] !== a2PathParts[i]) {
                        if (a1PathParts[i] === undefined) return -1;
                        if (a2PathParts[i] === undefined) return 1;
                        return a1PathParts[i].localeCompare(a2PathParts[i]);
                    }
                }
            }

            if (a2.path.includes(a1.path)) return -1;
            if (a1.path.includes(a2.path)) return 1;

            return 0;
        });
    }

    private sortFiles(
        files: FileInterface[],
        albums: AlbumInterface[]
    ): FileInterface[] {
        const albumPaths = albums.map((album) => album.path);

        return [...files].sort((f1, f2) =>
            f1.path.split('/')[0] === f2.path.split('/')[0] // the same root path
                ? f1.filename.localeCompare(f2.filename)
                : albumPaths.indexOf(f1.path) - albumPaths.indexOf(f2.path)
        );
    }
}
