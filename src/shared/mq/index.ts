import Promisable from '../types/Promisable';
import Client from './Client';

export interface Channel<Context, Name extends Client.Channels> {
    name: Name;
    handler: Channel.Handler<Context, Name>;
}

export namespace Channel {
    export type Handler<Context, Name extends Client.Channels> = (
        context: Context,
        data: Client.QueryData<Name>,
    ) => Promisable<Client.QueryResponse<Name>>;
}

export const MQClient = Client;

export function createChannel<Context, Name extends Client.Channels>(
    name: Name,
    handler: Channel.Handler<Context, Name>,
): Channel<Context, Name> {
    return {
        name,
        handler,
    };
}

type ValueOf<T> = T[keyof T];

type Channels<Context, ChannelNames extends Client.Channels> = ValueOf<{
    [ChannelName in ChannelNames]: Channel<Context, ChannelName>;
}>[];

export function registerChannels<Context, ChannelNames extends Client.Channels>(
    client: Client,
    context: Context,
    channels: Channels<Context, ChannelNames>,
) {
    channels.forEach(({ name, handler }) => {
        const wrappedHandler = (data: Client.QueryData<ChannelNames>) =>
            handler(context, data);

        client.subscribe(name, wrappedHandler);
    });
}

export default {
    MQClient,

    createChannel,
    registerChannels,
};
