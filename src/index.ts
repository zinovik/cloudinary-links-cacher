import * as functions from '@google-cloud/functions-framework';
import { Main } from './main/Main';
import { CloudinaryService } from './data/Cloudinary.service';
import { GoogleStorageService } from './storage/GoogleStorage.service';
import { ConfigParameterNotDefinedError } from './common/error/ConfigParameterNotDefinedError';

const BUCKET_NAME = 'zinovik-gallery';
const SOURCE_CONFIG_FILE_NAME = 'sources-config.json';
const ALBUMS_FILE_NAME = 'albums.json';
const FILES_FILE_NAME = 'files.json';
const PREFIX_START = 'gallery/';

functions.http('main', async (_req, res) => {
    console.log('Triggered!');

    if (process.env.CLOUDINARY_CREDENTIALS === undefined) {
        throw new ConfigParameterNotDefinedError('CLOUDINARY_CREDENTIALS');
    }

    const prefixes =
        'zanzibar,naliboki,sakartvelo,zalessie,sri-lanka,uzbekistan,berlin,netherlands,greece,gigs,board-games'; // TODO: Read from storage

    const main = new Main(
        new CloudinaryService(
            process.env.CLOUDINARY_CREDENTIALS,
            prefixes.split(','),
            PREFIX_START
        ),
        new GoogleStorageService(
            BUCKET_NAME,
            SOURCE_CONFIG_FILE_NAME,
            FILES_FILE_NAME,
            ALBUMS_FILE_NAME
        )
    );

    await main.process();

    console.log('Done!');

    res.status(200).json({
        result: 'success',
    });
});
