import MQClient from '../Client';
import DocumentDAO from '../../dao/document';

declare namespace Query {
    type RequestData = DocumentDAO.UpdateOptions & { id: number };

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
