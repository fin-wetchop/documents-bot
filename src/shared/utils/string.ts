/* eslint-disable no-plusplus */

interface Part {
    offset: number;
    length: number;
}

export function removeParts(string: string, parts: Part[]) {
    const sortedParts = [...parts].sort((a, b) => b.offset - a.offset);

    let result = string;

    sortedParts.forEach((part) => {
        result =
            result.substring(0, part.offset) +
            result.substring(part.offset + part.length);
    });

    return result;
}

export function fromBytes(buffer: ArrayBufferLike) {
    const bytes = new Uint8ClampedArray(buffer);
    const size = bytes.byteLength;

    let result = '';

    for (let i = 0; i < size; i++) {
        result += String.fromCharCode(bytes[i]);
    }

    return result;
}

const string = {
    removeParts,
    fromBytes,
};

export default string;
