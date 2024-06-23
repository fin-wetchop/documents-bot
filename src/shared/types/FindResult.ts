interface FindResult<Item> {
    pagination: {
        offset: number;
        limit?: number;
        total: number;
    };

    items: Item[];
}

declare namespace FindResult {
    interface Pagination {
        offset: number;
        limit?: number;
        total: number;
    }
}

export default FindResult;
