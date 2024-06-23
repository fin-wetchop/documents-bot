type Order<Keys extends string> = Order.Item<Keys>[];

declare namespace Order {
    type Direction = 'ASC' | 'DESC' | 'asc' | 'desc';

    interface Item<Key extends string> {
        key: Key;
        direction: Direction;
    }
}

export default Order;
