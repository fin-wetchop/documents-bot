import ORM from '../../../shared/orm';
import { MQClient, registerChannels } from '../../../shared/mq';
import Logger from '../../../shared/utils/logger';
import config from './config';
import ChannelContext from './types/channel-context';
import getChannel from './channels/get';
import findChannel from './channels/find';
import createChannel from './channels/create';
import updateChannel from './channels/update';
import deleteChannel from './channels/delete';

(async () => {
    const logger = new Logger('documents');

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

    const channelContext: ChannelContext = {
        mqClient,
        logger,
        orm,
    };

    registerChannels(mqClient, channelContext, [
        getChannel,
        findChannel,
        createChannel,
        updateChannel,
        deleteChannel,
    ]);

    logger.info('Documents service started!');
})();
