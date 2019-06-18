// tslint:disable: no-bitwise
export default function(input: string): string {
    let value = 0;
    for (let i = 0; i < input.length; i++) {
        let char = input.charCodeAt(i);
        value = ((value << 5) - value) + char;
        value = value & value; // 32bit int conversion
    }
    value = value & 0xfffffff;
    return value.toString(36);
}
