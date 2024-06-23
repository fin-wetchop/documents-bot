/* eslint-disable no-param-reassign */
import { QueriesClient } from 'kubemq-js';
import { v4 as uuid } from 'uuid';
import Promisable from '../types/Promisable';
import DefinedQueries from './queries';
import Coder from '../utils/coder';

class MQClient {
    private static coder = new Coder();

    private clientId: string;

    private queryClient: QueriesClient;

    constructor(options: MQClient.Options) {
        this.clientId = options.clientId || uuid();

        this.queryClient = new QueriesClient({
            address: `${options.host}:${options.port}`,
            clientId: this.clientId,
        });
    }

    public async send<Channel extends keyof MQClient.Queries>(
        channel: Channel,
        data: MQClient.QueryData<Channel>,
    ): Promise<MQClient.QueryResponse<Channel>> {
        const response = await this.queryClient.send({
            channel,
            clientId: this.clientId,
            body: MQClient.serialize(data),
        });

        if (response.error) {
            throw new Error(response.error);
        }

        if (!response.body) {
            throw new Error('Response body is empty');
        }

        return MQClient.deserialize(response.body);
    }

    public async subscribe<Channel extends keyof MQClient.Queries>(
        channel: Channel,
        callback: MQClient.SubscribeCallback<Channel>,
    ): Promise<void> {
        await this.queryClient.subscribe(
            {
                channel,
                clientId: this.clientId,
            },
            async (error, message) => {
                if (error) {
                    throw error;
                }

                if (!message.body) {
                    throw new Error('Message body is empty');
                }

                const data = MQClient.deserialize(message.body);
                const response = await callback(data);

                await this.queryClient.response({
                    id: message.id,
                    clientId: this.clientId,
                    replyChannel: message.replyChannel,
                    body: MQClient.serialize(response),
                    error: '',
                    timestamp: Date.now(),
                    executed: true,
                });
            },
        );
    }

    private static serialize(data: any): Buffer {
        const encodedData = this.coder.encode(data);

        const bytes: any[] = [];

        encodedData.split('').forEach((c) => {
            bytes.push(c.charCodeAt(0));
        });

        return Buffer.from(bytes);
    }

    private static deserialize(data: string | Uint8Array): any {
        if (typeof data !== 'string') {
            data = Array.from(data)
                .map((byte) => String.fromCharCode(byte))
                .join('');
        }

        return this.coder.decode(data);
    }
}

declare namespace MQClient {
    interface Options {
        host: string;
        port: number;
        clientId?: string;
    }

    type Serializable =
        | undefined
        | null
        | boolean
        | number
        | string
        | Date
        | Map<any, any>
        | Set<any>
        | Function
        | RegExp
        | bigint
        | URL
        | Serializable[]
        | { [key: string]: Serializable };

    type Query<Data, Response> = [Data, Response];

    type QueryData<Name extends Channels> = Queries[Name][0];
    type QueryResponse<Name extends Channels> = Queries[Name][1];

    type Channels = keyof Queries;

    type Queries = DefinedQueries;

    type SubscribeCallback<Channel extends Channels> = (
        data: QueryData<Channel>,
    ) => Promisable<QueryResponse<Channel>>;
}

export default MQClient;
