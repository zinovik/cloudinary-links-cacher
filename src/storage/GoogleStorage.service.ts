import { Bucket, Storage, File } from '@google-cloud/storage';
import { StorageService } from './Storage.interface';
import { MediaMetadata } from '../common/types/MediaMetadata';

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

    async saveSourcesConfig(data: MediaMetadata): Promise<void> {
        const file: File = this.bucket.file(this.sourceConfigFileName);

        const dataPrefixRemoved: Record<string, string> = Object.keys(
            data
        ).reduce(
            (acc, filename) => ({
                ...acc,
                [filename]: data[filename].url,
            }),
            {}
        );

        const dataBuffer = Buffer.from(JSON.stringify(dataPrefixRemoved));

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

    async updateGallery(data: MediaMetadata): Promise<void> {
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

        const newFilenames = Object.keys(data).filter(
            (filename) => !files.some((file) => file.filename === filename)
        );

        console.log('NEW FILENAMES:', newFilenames.join(', '));

        if (newFilenames.length > 0) {
            files.push(
                ...newFilenames.map((filename) => {
                    const source = data[filename];

                    return {
                        path: `${source.prefix}/unsorted`,
                        filename,
                        description: '',
                    };
                })
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
            albums = this.sortAlbums(albums);
        }

        // TODO: Save in Promise.all
        if (newFilenames.length > 0) {
            const filesDataBuffer = Buffer.from(
                JSON.stringify(this.sortFiles(files, albums))
            );

            await filesFile.save(filesDataBuffer, {
                gzip: true,
                public: true,
                resumable: true,
                contentType: 'application/json',
                metadata: {
                    cacheControl: 'no-cache',
                },
            });
        }

        if (newPaths.length > 0) {
            const albumsDataBuffer = Buffer.from(JSON.stringify(albums));

            await albumsFile.save(albumsDataBuffer, {
                gzip: true,
                public: true,
                resumable: true,
                contentType: 'application/json',
                metadata: {
                    cacheControl: 'no-cache',
                },
            });
        }
    }

    private sortAlbums(albums: AlbumInterface[]): AlbumInterface[] {
        const sortedAlbums = albums
            .filter((album) => album.isSorted)
            .map((album) => album.path);

        return [...albums].sort((a1, a2) => {
            if (a1.path.split('/')[0] !== a2.path.split('/')[0]) {
                return 0;
            }

            // the same root path

            // is sorted album
            if (sortedAlbums.includes(a1.path.split('/')[0])) {
                const a1PathParts = a1.path.split('/');
                const a2PathParts = a2.path.split('/');

                if (a1PathParts.length === a2PathParts.length)
                    return a1.path.localeCompare(a2.path);

                const minPathParts = Math.min(
                    a1PathParts.length,
                    a2PathParts.length
                );

                for (let i = 0; i < minPathParts; i++) {
                    if (a1PathParts[i] !== a2PathParts[i]) {
                        if (a1PathParts[i] === undefined) return -1;
                        if (a2PathParts[i] === undefined) return -1;
                        return a2PathParts[i].localeCompare(a2PathParts[i]);
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
