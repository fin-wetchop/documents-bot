import MQClient from '../../../../shared/mq/Client';
import ORM from '../../../../shared/orm';
import Logger from '../../../../shared/utils/logger';

interface ChannelContext {
    logger: Logger;
    orm: ORM;
    mqClient: MQClient;
}

export default ChannelContext;
