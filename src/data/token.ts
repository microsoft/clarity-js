let tokens: string[] = [];

export function check(hash: string): boolean {
    let output = tokens.indexOf(hash) >= 0;
    return output;
}

export function resolve(hash: string): string[] {
    return check(hash) ? tokens[hash] : [];
}
