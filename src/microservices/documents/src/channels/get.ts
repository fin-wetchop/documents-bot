import { createChannel } from '../../../../shared/mq';
import DocumentDAO from '../../../../shared/dao/document';
import ChannelContext from '../types/channel-context';

const channel = createChannel(
    'documents.get',
    async (context: ChannelContext, data) => {
        const { orm } = context;

        const documentDAO = new DocumentDAO({
            entityManager: orm.manager,
        });

        return documentDAO.get(data.id, data.relations);
    },
);

export default channel;
