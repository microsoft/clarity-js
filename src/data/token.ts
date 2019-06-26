let tokens = {};

export function check(hash: string, metadata: string[]): boolean {
    let output = hash in tokens;
    tokens[hash] = metadata;
    return output;
}

export function resolve(hash: string): string[] {
    return hash in tokens ? tokens[hash] : [];
}
