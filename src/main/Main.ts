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
        const id = Date.now();

        console.time('Getting source config from the data service ' + id);
        const sources = await this.dataService.getSources();
        console.timeLog('Getting source config from the data service ' + id);

        console.time('Writing source config to the storage service ' + id);
        await this.storageService.saveSourcesConfig(sources);
        console.timeLog('Writing source config to the storage service ' + id);

        console.time('Updating gallery ' + id);
        await this.storageService.updateGallery(sources);
        console.timeLog('Updating gallery ' + id);
    }
}
