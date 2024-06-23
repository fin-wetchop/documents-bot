import MQClient from '../Client';
import Arrayable from '../../types/Arrayable';

declare namespace Query {
    type RequestData = Arrayable<number>;

    type ResponseData = {
        [id: number]: string;
    };
}

type Query = MQClient.Query<Query.RequestData, Query.ResponseData>;

export default Query;
