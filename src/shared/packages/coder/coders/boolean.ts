/* eslint-disable class-methods-use-this */

import { isBoolean } from 'lodash';
import Coder from '..';

class BooleanCoder extends Coder<boolean> {
    public readonly id = 'b';

    public check(data: any): data is boolean {
        return isBoolean(data);
    }

    public encode(data: boolean): string {
        return data ? '1' : '0';
    }

    public decode(data: string): boolean {
        return data === '1';
    }
}

export default BooleanCoder;
