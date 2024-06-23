/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */

import BaseCoder from '../packages/coder';
import ObjectLike from '../types/ObjectLike';

import UndefinedCoder from '../packages/coder/coders/undefined';
import NullCoder from '../packages/coder/coders/null';
import BooleanCoder from '../packages/coder/coders/boolean';
import NumberCoder from '../packages/coder/coders/number';
import StringCoder from '../packages/coder/coders/string';
import DateCoder from '../packages/coder/coders/date';
import ArrayCoder from '../packages/coder/coders/array';
import ObjectCoder from '../packages/coder/coders/object';

class Coder extends BaseCoder {
    public readonly id = 'c';

    constructor() {
        super();

        this.register([
            UndefinedCoder,
            NullCoder,
            BooleanCoder,
            NumberCoder,
            StringCoder,
            DateCoder,
            ArrayCoder,
            ObjectCoder,
        ]);
    }

    public check(data: any): data is any {
        return true;
    }

    public encode(data: ObjectLike): string {
        const coder = this.findCoder(data);

        if (!coder) {
            throw new Error(`Cannot find coder for ${data}`);
        }

        return `${coder.id}${coder.encode(data)}`;
    }

    public decode(data: string): any {
        const coderId = data[0];

        data = data.slice(1);

        const coder = this.findCoderById(coderId);

        if (!coder) {
            throw new Error(`Cannot find coder for ${coderId}`);
        }

        return coder.decode(data);
    }
}

export default Coder;
