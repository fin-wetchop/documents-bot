import Document from '../../orm/entities/Document';
import DocumentDAO from '../../dao/document';
import FindResult from '../../types/FindResult';
import MQClient from '../Client';

declare namespace Query {
    type RequestData = DocumentDAO.FindOptions;

    type ResponseData = FindResult<Document>;
}

type Query = MQClient.Query<Query.RequestData, Query.ResponseData>;

export default Query;
