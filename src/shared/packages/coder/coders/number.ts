/* eslint-disable class-methods-use-this */

import { isNumber } from 'lodash';
import Coder from '..';

class NumberCoder extends Coder<number> {
    public readonly id = 'i';

    public check(data: any): data is number {
        return isNumber(data);
    }

    public encode(data: number): string {
        return data.toString(10);
    }

    public decode(data: string): number {
        return parseFloat(data);
    }
}

export default NumberCoder;
