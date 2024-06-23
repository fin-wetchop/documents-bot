/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */

import { isUndefined } from 'lodash';
import Coder from '..';

class UndefinedCoder extends Coder<undefined> {
    public readonly id = 'u';

    public check(data: any): data is undefined {
        return isUndefined(data);
    }

    public encode(data: undefined): string {
        return '';
    }

    public decode(data: string): undefined {
        return undefined;
    }
}

export default UndefinedCoder;
