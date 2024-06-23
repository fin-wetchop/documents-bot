import MQClient from '../Client';

declare namespace Query {
    type RequestData = {
        ownerUserId: number;
        fileId: number;

        name: string;
        tags: string[];
    };

    type ResponseData = {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        fileId: number;
        tagIds: number[];
    };
}

type Query = MQClient.Query<Query.RequestData, Query.ResponseData>;

export default Query;
