/* eslint-disable class-methods-use-this */

import { isString } from 'lodash';
import Coder from '..';

class StringCoder extends Coder<string> {
    public readonly id = 's';

    public check(data: any): data is string {
        return isString(data);
    }

    public encode(data: string): string {
        const utf8Encoder = new TextEncoder();

        return Array.from(utf8Encoder.encode(data))
            .map((byte) => String.fromCharCode(byte))
            .join('');
    }

    public decode(data: string): string {
        const utf8Decoder = new TextDecoder();

        return utf8Decoder.decode(
            Uint8Array.from(data.split('').map((char) => char.charCodeAt(0))),
        );
    }
}

export default StringCoder;
