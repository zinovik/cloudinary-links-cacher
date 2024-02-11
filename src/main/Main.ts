import { DataService } from '../data/DataService.interface';
import { StorageService } from '../storage/Storage.interface';

export class Main {
    constructor(
        private readonly dataService: DataService,
        private readonly storageService: StorageService
    ) {
        this.dataService = dataService;
        this.storageService = storageService;
    }

    async process(): Promise<void> {
        console.time('Getting source config from the data service');
        const mediaMetadata = await this.dataService.getMediaMetadata();
        console.timeLog('Getting source config from the data service');

        console.time('Writing source config to the storage service');
        await this.storageService.saveSourcesConfig(mediaMetadata);
        console.timeLog('Writing source config to the storage service');

        console.time('Updating gallery');
        await this.storageService.updateGallery(mediaMetadata);
        console.timeLog('Updating gallery');
    }
}
