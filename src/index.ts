import * as functions from '@google-cloud/functions-framework';
import { Main } from './main/Main';
import { CloudinaryService } from './data/Cloudinary.service';
import { GoogleStorageService } from './storage/GoogleStorage.service';
import { ConfigParameterNotDefinedError } from './common/error/ConfigParameterNotDefinedError';

const BUCKET_NAME = 'zinovik-gallery';
const FILE_NAME = 'sources-config.json';
const PREFIXES = [
    'gallery/zanzibar',
    'gallery/naliboki',
    'gallery/sakartvelo',
    'gallery/zalessie',
    'gallery/sri-lanka',
    'gallery/uzbekistan',
    'gallery/berlin',
    'gallery/netherlands',
    'gallery/greece',
    'gallery/gigs',
    'gallery/board-games',
];

functions.http('main', async (_req, res) => {
    console.log('Triggered!');

    if (process.env.CLOUDINARY_CREDENTIALS === undefined) {
        throw new ConfigParameterNotDefinedError('CLOUDINARY_CREDENTIALS');
    }

    const main = new Main(
        new CloudinaryService(process.env.CLOUDINARY_CREDENTIALS, PREFIXES),
        new GoogleStorageService(BUCKET_NAME, FILE_NAME)
    );

    await main.process();

    console.log('Done!');

    res.status(200).json({
        result: 'success',
    });
});
