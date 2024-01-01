import * as functions from '@google-cloud/functions-framework';
import { Main } from './main/Main';
import { CloudinaryService } from './data/Cloudinary.service';
import { GoogleStorageService } from './storage/GoogleStorage.service';
import { ConfigParameterNotDefinedError } from './common/error/ConfigParameterNotDefinedError';

const BUCKET_NAME = 'zinovik-gallery';
const FILE_NAME = 'sources-config.json';

functions.http('main', async (req, res) => {
    console.log('Triggered!');

    if (process.env.CLOUDINARY_CREDENTIALS === undefined) {
        throw new ConfigParameterNotDefinedError('CLOUDINARY_CREDENTIALS');
    }

    const {
        query: { prefixes },
    } = req;

    if (typeof prefixes !== 'string') {
        res.status(422).json({
            error: 'wrong prefixes',
        });
        return;
    }

    console.log('Prefixes: ', prefixes);

    const main = new Main(
        new CloudinaryService(
            process.env.CLOUDINARY_CREDENTIALS,
            prefixes.split(',')
        ),
        new GoogleStorageService(BUCKET_NAME, FILE_NAME)
    );

    await main.process();

    console.log('Done!');

    res.status(200).json({
        result: 'success',
    });
});
