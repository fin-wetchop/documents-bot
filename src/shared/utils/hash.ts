import * as stream from 'node:stream';
import sha256 from 'crypto-js/sha256';

function defaultHash(data: Buffer | string): string {
    return sha256(
        Buffer.isBuffer(data) ? data.toString('utf-8') : data,
    ).toString();
}

function streamHash(dataStream: stream.Readable): Promise<string> {
    const passThrough = new stream.PassThrough();

    dataStream.pipe(passThrough);

    return new Promise((resolve) => {
        let data = '';

        passThrough.on('data', (chunk) => {
            data += chunk.toString();
        });

        passThrough.on('end', () => {
            resolve(sha256(data).toString());
        });
    });
}

function hash(
    data: Buffer | string | stream.Readable,
): Promise<string> | string {
    if (data instanceof stream.Readable) {
        return streamHash(data);
    }

    return defaultHash(data);
}

export default hash;
