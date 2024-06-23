import MQClient from '../Client';

declare namespace Query {
    type RequestData = { id: number };

    type ResponseData = void;
}

type Query = MQClient.Query<Query.RequestData, Query.ResponseData>;

export default Query;
