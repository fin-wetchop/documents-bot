/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */

import { isNull } from 'lodash';
import Coder from '..';

class NullCoder extends Coder<null> {
    public readonly id = 'n';

    public check(data: any): data is null {
        return isNull(data);
    }

    public encode(data: null): string {
        return '';
    }

    public decode(data: string): null {
        return null;
    }
}

export default NullCoder;
