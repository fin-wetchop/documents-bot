import Arrayable from '../../types/Arrayable';

interface Base {
    new (coders?: Coder[]): Coder;
}

abstract class Coder<Type extends any = any> {
    public abstract readonly id: string;

    private coders: Coder[];

    constructor(coders?: Coder[]) {
        this.coders = coders ?? [];
    }

    protected register(CoderClass: Arrayable<Base>) {
        if (Array.isArray(CoderClass)) {
            CoderClass.forEach((CoderClass) => this.register(CoderClass));

            return this;
        }

        this.coders.push(new CoderClass(this.coders));

        return this;
    }

    protected findCoder(data: any): Coder | undefined {
        return this.coders.find((coder) => coder.check(data));
    }

    protected findCoderById(id: string): Coder | undefined {
        return this.coders.find((coder) => coder.id === id);
    }

    public abstract check(data: Type): data is Type;

    public abstract encode(data: Type): string;

    public abstract decode(data: string): Type;
}

export default Coder;
