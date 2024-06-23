import { Client } from 'minio';
import { v4 as uuid } from 'uuid';
import * as stream from 'node:stream';

class Minio {
    private static bucket: string = 'documents';

    private client: Client;

    constructor(options: Minio.Options) {
        this.client = new Client({
            endPoint: options.host,
            port: options.port,

            useSSL: false,

            accessKey: options.username,
            secretKey: options.password,
        });
    }

    async upload(
        data: stream.Readable | Buffer | string,
        size?: number,
        metaData?: Record<string, any>,
    ) {
        const objectId = uuid();

        const doesBucketExist = await this.client.bucketExists(Minio.bucket);

        if (!doesBucketExist) await this.client.makeBucket(Minio.bucket);

        const object = await this.client.putObject(
            Minio.bucket,
            objectId,
            data,
            size,
            metaData,
        );

        return {
            id: objectId,
            etag: object.etag,
        };
    }

    async download(objectId: string) {
        return this.client.getObject(Minio.bucket, objectId);
    }

    async remove(objectId: string) {
        return this.client.removeObject(Minio.bucket, objectId);
    }
}

declare namespace Minio {
    interface Options {
        host: string;
        port: number;

        username: string;
        password: string;
    }
}

export default Minio;
