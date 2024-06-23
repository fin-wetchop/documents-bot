type JSONLike =
    | string
    | number
    | boolean
    | null
    | JSONLike[]
    | { [key: string]: JSONLike };

export default JSONLike;
