/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */

import { isObjectLike } from 'lodash';
import Coder from '..';
import ObjectLike from '../../../types/ObjectLike';
import bytes from '../../../utils/bytes';
import string from '../../../utils/string';

class ObjectCoder extends Coder<ObjectLike> {
    public readonly id = 'o';

    public check(data: any): data is ObjectLike {
        return isObjectLike(data);
    }

    public encode(data: ObjectLike): string {
        let result = '';

        Object.entries(data).forEach(([key, value]) => {
            const coder = this.findCoder(value);

            if (!coder) {
                throw new Error(`Cannot find coder for value ${value}`);
            }

            const encodedValue = coder.encode(value);

            const keyLength = string.fromBytes(bytes.to(key.length, 4));

            const encodedValueLength = string.fromBytes(
                bytes.to(encodedValue.length, 4),
            );

            result += `${coder.id}${keyLength}${key}${encodedValueLength}${encodedValue}`;
        });

        return result;
    }

    public decode(data: string): ObjectLike {
        const result: ObjectLike = {};

        while (data.length > 0) {
            const coderId = data[0];

            data = data.slice(1);

            const keyLength = bytes.from(bytes.fromString(data.slice(0, 4)));

            data = data.slice(4);

            const key = data.slice(0, keyLength);

            data = data.slice(keyLength);

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

            result[key] = coder.decode(encodedValue);
        }

        return result;
    }
}

export default ObjectCoder;
