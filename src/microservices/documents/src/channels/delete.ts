import { createChannel } from '../../../../shared/mq';
import DocumentDAO from '../../../../shared/dao/document';
import ChannelContext from '../types/channel-context';

const channel = createChannel(
    'documents.delete',
    async (context: ChannelContext, data) => {
        const { orm } = context;

        const documentDAO = new DocumentDAO({
            entityManager: orm.manager,
        });

        await documentDAO.delete(data.id);
    },
);

export default channel;
