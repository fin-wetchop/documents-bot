import { defaults } from 'lodash';
import { createChannel } from '../../../../shared/mq';
import DocumentDAO from '../../../../shared/dao/document';
import ChannelContext from '../types/channel-context';

const channel = createChannel(
    'documents.find',
    async (context: ChannelContext, data) => {
        const { orm } = context;

        const documentDAO = new DocumentDAO({
            entityManager: orm.manager,
        });

        const searchOptions = defaults({}, data, {
            order: [
                {
                    key: 'updatedAt',
                    direction: 'ASC',
                },
            ],
        });

        const findResult = await documentDAO.find(searchOptions);

        return findResult;
    },
);

export default channel;
