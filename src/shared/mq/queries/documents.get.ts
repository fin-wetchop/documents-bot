import { FindOptionsRelations } from 'typeorm';
import Document from '../../orm/entities/Document';
import MQClient from '../Client';

declare namespace Query {
    type RequestData = {
        id: number;

        relations?: FindOptionsRelations<Document>;
    };

    type ResponseData = Document | null;
}

type Query = MQClient.Query<Query.RequestData, Query.ResponseData>;

export default Query;
