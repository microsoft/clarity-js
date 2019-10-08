// tslint:disable: no-bitwise
export default function(input: string): string {
    // Code inspired from C# GetHashCode: https://github.com/Microsoft/referencesource/blob/master/mscorlib/system/string.cs
    let hash = 0;
    let hashOne = 5381;
    let hashTwo = hashOne;
    for (let i = 0; i < input.length; i += 2) {
        let charOne = input.charCodeAt(i);
        hashOne = ((hashOne << 5) + hashOne) ^ charOne;
        if (i + 1 < input.length) {
            let charTwo = input.charCodeAt(i + 1);
            hashTwo = ((hashTwo << 5) + hashTwo) ^ charTwo;
        }
    }
    hash = (hashOne + (hashTwo * 1566083941));
    return hash.toString(36);
}
