import express from 'express';
import { isNull, isUndefined } from 'lodash';
import contentDisposition from 'content-disposition';
import ORM from '../../../shared/orm';
import { MQClient, registerChannels } from '../../../shared/mq';
import Minio from '../../../shared/minio';
import Logger from '../../../shared/utils/logger';
import config from './config';
import ChannelContext from './types/channel-context';
import makeLinkToFileChannel from './channels/make-link-to-file';
import LinkManager from './utils/LinkManager';
import File from '../../../shared/orm/entities/File';

(async () => {
    const logger = new Logger('web-server');

    const linkManager = new LinkManager({
        host: config.webServer.externalHost,
        port: config.webServer.port,
    });

    const orm = new ORM({
        type: config.database.dialect,
        host: config.database.host,
        port: config.database.port,
        username: config.database.username,
        password: config.database.password,
        database: config.database.database,
    });

    await orm.start();

    const mqClient = new MQClient({
        host: config.mq.host,
        port: config.mq.grpcPort,
    });

    const minio = new Minio({
        host: config.minio.host,
        port: config.minio.port,

        username: config.minio.username,
        password: config.minio.password,
    });

    const channelContext: ChannelContext = {
        logger,
        linkManager,
        orm,
        mqClient,
    };

    registerChannels(mqClient, channelContext, [makeLinkToFileChannel]);

    const app = express();

    app.get('/file/:id', async (request, response) => {
        const { id } = request.params;

        const fileId = linkManager.get(id);

        if (isUndefined(fileId)) {
            response.status(404).send('File not found');

            return;
        }

        const fileRepository = orm.manager.getRepository(File);

        const file = await fileRepository.findOneBy({ id: fileId });

        if (isNull(file)) {
            response.status(404).send('File not found');

            return;
        }

        response.setHeader(
            'Content-Type',
            file.mimeType ?? 'application/octet-stream',
        );
        response.setHeader(
            'Content-Disposition',
            contentDisposition(file.name + file.extension, { type: 'inline' }),
        );

        (await minio.download(file.minioId)).pipe(response);
    });

    app.use((req, response) => {
        response.status(404);

        if (req.accepts('json')) {
            response.json({ error: 'Not found' });

            return;
        }

        response.type('txt').send('Not found');
    });

    app.listen(config.webServer.port, config.webServer.internalHost, () => {
        const url = new URL('http://test');

        url.hostname = config.webServer.externalHost;
        url.port = config.webServer.port.toString();

        logger.info(`Web-server is ready! (${url.href})`);
    });

    logger.info('Web-server service started!');
})();
