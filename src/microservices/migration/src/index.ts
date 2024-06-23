import ORM from '../../../shared/orm';
import Logger from '../../../shared/utils/logger';
import config from './config';

const logger = new Logger('migration');

const orm = new ORM({
    type: config.database.dialect,
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.database,
});

(async () => {
    try {
        await orm.start();

        logger.info('Database is ready!');
    } catch (error: any) {
        logger.error('Database initialization failed!');
    }
})();
