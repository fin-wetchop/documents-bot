/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-bitwise */

function bitLength(number: number) {
    return Math.floor(Math.log2(number)) + 1;
}

function byteLength(number: number) {
    return Math.ceil(bitLength(number) / 8);
}

export function to(number: number, size?: number) {
    if (!Number.isSafeInteger(number)) {
        throw new Error('Number is out of range');
    }

    const actualSize = number === 0 ? 0 : byteLength(number);

    size = size ?? actualSize;

    const bytes = new Uint8ClampedArray(size);

    let x = number;

    for (let i = size - 1; i >= size - actualSize; i--) {
        const rightByte = x & 0xff;

        bytes[i] = rightByte;

        x = Math.floor(x / 0x100);
    }

    return bytes.buffer;
}

export function from(buffer: ArrayBufferLike) {
    const bytes = new Uint8ClampedArray(buffer);
    const size = bytes.byteLength;

    let x = 0;

    for (let i = 0; i < size; i++) {
        const byte = bytes[i];

        x *= 0x100;
        x += byte;
    }

    return x;
}

export function fromString(string: string) {
    const buffer = Buffer.alloc(string.length);

    string.split('').forEach((char, index) => {
        buffer[index] = char.charCodeAt(0);
    });

    return buffer.buffer;
}

export default {
    to,
    from,
    fromString,
};
