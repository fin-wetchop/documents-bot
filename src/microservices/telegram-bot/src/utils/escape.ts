function escape(string: string): string {
    // eslint-disable-next-line no-useless-escape
    return string.replace(/([|{\[\]*_~}+)(#>!=\-.])/gm, '\\$&');
}

export default escape;
