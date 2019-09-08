export default function(value: string): string {
    let wasWhiteSpace = false;
    let textCount = 0;
    let wordCount = 0;
    for (let i = 0; i < value.length; i++) {
        let code = value.charCodeAt(i);
        let isWhiteSpace = (code === 32 || code === 10 || code === 9 || code === 13);
        let isNotCharacter = ((code >= 33 && code <= 47) || (code >= 91 && code <= 96) || (code >= 123 && code <= 126));
        textCount += isWhiteSpace || isNotCharacter ? 0 : 1;
        wordCount += isWhiteSpace && !wasWhiteSpace ? 1 : 0;
        wasWhiteSpace = isWhiteSpace;
    }
    return `${textCount.toString(36)}*${wordCount.toString(36)}`;
}
