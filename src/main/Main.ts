import { StorageService } from '../storage/Storage.interface';

export class Main {
    constructor(private readonly storageService: StorageService) {
        this.storageService = storageService;
    }

    async process(): Promise<void> {
        const id = Date.now();

        console.time('Getting source config from the storage service ' + id);
        const sources = await this.storageService.getSources();
        console.timeLog('Getting source config from the storage service ' + id);

        console.time('Writing source config to the storage service ' + id);
        await this.storageService.saveSourcesConfig(sources);
        console.timeLog('Writing source config to the storage service ' + id);

        console.time('Updating gallery ' + id);
        await this.storageService.updateGallery(sources);
        console.timeLog('Updating gallery ' + id);
    }
}
