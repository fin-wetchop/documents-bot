import { DataSource, DataSourceOptions } from 'typeorm';
import Document from './entities/Document';
import Tag from './entities/Tag';
import File from './entities/File';
import Permission from './entities/Permission';

class ORM extends DataSource {
    constructor(options: DataSourceOptions) {
        const entities = [Document, Tag, File, Permission];

        if (options.type === 'postgres') {
            super({
                useUTC: true,

                entities,

                ...options,
            });
        } else if (options.type === 'mysql') {
            super({
                timezone: 'utc',

                entities,

                ...options,
            });
        }
    }

    async start() {
        if (!this.isInitialized) {
            await this.initialize();
            await this.synchronize();
        }
    }
}

export default ORM;
