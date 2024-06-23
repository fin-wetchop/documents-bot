/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */

import { isArray } from 'lodash';
import Coder from '..';
import bytes from '../../../utils/bytes';
import string from '../../../utils/string';

class ArrayCoder extends Coder<ArrayLike<any>> {
    public readonly id = 'a';

    public check(data: any): data is ArrayLike<any> {
        return isArray(data);
    }

    public encode(data: ArrayLike<any>): string {
        let result = '';

        Array.from(data).forEach((item, index) => {
            const coder = this.findCoder(item);

            if (!coder) {
                throw new Error(
                    `Cannot find coder for item value ${item} with index ${index}`,
                );
            }

            const encodedValue = coder.encode(item);

            const encodedValueLength = string.fromBytes(
                bytes.to(encodedValue.length, 4),
            );

            result += `${coder.id}${encodedValueLength}${encodedValue}`;
        });

        return result;
    }

    public decode(data: string): ArrayLike<any> {
        const result: any[] = [];

        while (data.length > 0) {
            const coderId = data[0];

            data = data.slice(1);

            const encodedValueLength = bytes.from(
                bytes.fromString(data.slice(0, 4)),
            );

            data = data.slice(4);

            const encodedValue = data.slice(0, encodedValueLength);

            data = data.slice(encodedValueLength);

            const coder = this.findCoderById(coderId);

            if (!coder) {
                throw new Error(`Cannot find coder with id ${coderId}`);
            }

            result.push(coder.decode(encodedValue));
        }

        return result;
    }
}

export default ArrayCoder;
