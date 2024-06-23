import { createChannel } from '../../../../shared/mq';
import DocumentDAO from '../../../../shared/dao/document';
import ChannelContext from '../types/channel-context';

const channel = createChannel(
    'documents.create',
    async (context: ChannelContext, data) => {
        const { orm } = context;

        const documentDAO = new DocumentDAO({
            entityManager: orm.manager,
        });

        const document = await documentDAO.create({
            ownerUserId: data.ownerUserId,
            fileId: data.fileId,

            name: data.name,
            tags: data.tags,
        });

        return {
            id: document.id,
            name: document.name,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
            deletedAt: document.deletedAt,
            fileId: document.fileId,
            tagIds: document.tagIds,
        };
    },
);

export default channel;
