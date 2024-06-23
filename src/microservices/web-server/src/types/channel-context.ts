import MQClient from '../../../../shared/mq/Client';
import ORM from '../../../../shared/orm';
import Logger from '../../../../shared/utils/logger';
import LinkManager from '../utils/LinkManager';

interface ChannelContext {
    linkManager: LinkManager;
    logger: Logger;
    orm: ORM;
    mqClient: MQClient;
}

export default ChannelContext;
