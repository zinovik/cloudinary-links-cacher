import * as functions from '@google-cloud/functions-framework';
import { Main } from './main/Main';
import { GoogleStorageService } from './storage/GoogleStorage.service';

const BUCKET_NAME = 'zinovik-gallery';
const SOURCE_CONFIG_FILE_NAME = 'sources-config.json';

functions.http('main', async (req, res) => {
    console.log('Triggered!');

    const main = new Main(
        new GoogleStorageService(BUCKET_NAME, SOURCE_CONFIG_FILE_NAME)
    );

    await main.process(req.query['is-public'] === 'true');

    console.log('Done!');

    res.status(200).json({
        result: 'success',
    });
});
