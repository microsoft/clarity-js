export function hash(input: string): number {
    let value = 0;
    if (input.length === 0) { return value; }
    for (let i = 0; i < input.length; i++) {
        let char = input.charCodeAt(i);
        // tslint:disable-next-line: no-bitwise
        value = ((value << 5) - value) + char;
        // tslint:disable-next-line: no-bitwise
        value = value & value; // 32bit int conversion
    }
    return value;
}
