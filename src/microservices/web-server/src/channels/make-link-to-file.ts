import { isArray } from 'lodash';
import { createChannel } from '../../../../shared/mq';
import ChannelContext from '../types/channel-context';

const channel = createChannel(
    'web-server.make-link-to-file',
    async (context: ChannelContext, data) => {
        const { linkManager } = context;

        const ids: Record<number, string> = {};

        if (isArray(data)) {
            data.forEach((fileId) => {
                const idToDownload = linkManager.register(fileId);

                ids[fileId] = idToDownload;
            });
        } else {
            const idToDownload = linkManager.register(data);

            ids[data] = idToDownload;
        }

        return ids;
    },
);

export default channel;
