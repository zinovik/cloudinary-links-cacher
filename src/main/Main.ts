import { StorageService } from '../storage/Storage.interface';

export class Main {
    constructor(private readonly storageService: StorageService) {
        this.storageService = storageService;
    }

    async process(isPublic?: boolean): Promise<void> {
        const id = Date.now();

        console.time(`${id} Getting source config from the storage service`);
        const sources = await this.storageService.getSources(isPublic);
        console.timeLog(`${id} Getting source config from the storage service`);

        console.time(`${id} Writing source config to the storage service`);
        await this.storageService.saveSourcesConfig(sources);
        console.timeLog(`${id} Writing source config to the storage service`);
    }
}
