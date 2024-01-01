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
        console.time('Getting data from the data service');
        const sourcesConfig = await this.dataService.getSourcesConfig();
        console.timeLog('Getting data from the data service');

        console.log(sourcesConfig);

        console.time('Writing data to the storage service');
        await this.storageService.saveSourcesConfig(sourcesConfig);
        console.timeLog('Writing data to the storage service');
    }
}
