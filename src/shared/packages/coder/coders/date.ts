/* eslint-disable class-methods-use-this */

import { isDate } from 'lodash';
import Coder from '..';
import bytes from '../../../utils/bytes';
import string from '../../../utils/string';

class DateCoder extends Coder<Date> {
    public readonly id = 'd';

    public check(data: any): data is Date {
        return isDate(data);
    }

    public encode(data: Date): string {
        return string.fromBytes(bytes.to(data.getTime(), 8));
    }

    public decode(data: string): Date {
        return new Date(bytes.from(bytes.fromString(data)));
    }
}

export default DateCoder;
