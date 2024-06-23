import * as stream from 'node:stream';
import { EntityManager } from 'typeorm';
import Minio from '../minio';
import FileEntity from '../orm/entities/File';

class File {
    private minio: Minio;

    private entityManager: EntityManager;

    constructor(options: File.Options) {
        this.minio = options.minio;
        this.entityManager = options.entityManager;
    }

    public async upload(options: File.UploadOptions) {
        const { name, extension, data, size, mimeType } = options;

        const fileObject = await this.minio.upload(data, size);

        try {
            const file = await this.entityManager.transaction(
                async (manager) => {
                    const fileRepository = manager.getRepository(File.Entity);

                    const file = await fileRepository.save(
                        fileRepository.create({
                            minioId: fileObject.id,
                            name,
                            extension,
                            size,
                            mimeType,
                            hash: fileObject.id,
                        }),
                    );

                    return file;
                },
            );

            return file;
        } catch (error) {
            await this.minio.remove(fileObject.id);

            throw error;
        }
    }

    public async delete(id: number) {
        const fileRepository = this.entityManager.getRepository(File.Entity);

        const file = await fileRepository.findOneBy({ id });

        if (!file) {
            throw new Error(`The file with id "${id}" is not found`);
        }

        await this.minio.remove(file.minioId);

        await this.entityManager.softRemove(file);
    }
}

namespace File {
    export type Entity = FileEntity;
    export const Entity = FileEntity;

    export interface Options {
        minio: Minio;
        entityManager: EntityManager;
    }

    export interface UploadOptions {
        name: string;
        extension: string;
        data: stream.Readable | Buffer | string;
        size?: number;
        mimeType?: string;
    }
}

export default File;
