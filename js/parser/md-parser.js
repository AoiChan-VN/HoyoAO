// ./js/parser/md-parser.js

export class MDParser {
    constructor() {
        this.tokens = [];
    }

    async load(path) {
        const response =
            await fetch(path);

        if (!response.ok) {
            throw new Error(
                `[MD_PARSER] Failed to load ${path}`
            );
        }

        const content =
            await response.text();

        return this.parse(
            content
        );
    }

    parse(markdown) {
        this.tokens = [];

        const lines =
            markdown.split(
                /\r?\n/
            );

        for (
            let i = 0;
            i < lines.length;
            i += 1
        ) {
            const line =
                lines[i];

            if (
                line.trim() === ''
            ) {
                continue;
            }

            this.tokens.push(
                this.parseLine(
                    line
                )
            );
        }

        return this.tokens;
    }

    parseLine(line) {
        const trimmed =
            line.trim();

        if (
            trimmed.startsWith(
                '### '
            )
        ) {
            return {
                type: 'h3',
                text:
                    trimmed.slice(
                        4
                    )
            };
        }

        if (
            trimmed.startsWith(
                '## '
            )
        ) {
            return {
                type: 'h2',
                text:
                    trimmed.slice(
                        3
                    )
            };
        }

        if (
            trimmed.startsWith(
                '# '
            )
        ) {
            return {
                type: 'h1',
                text:
                    trimmed.slice(
                        2
                    )
            };
        }

        if (
            trimmed.startsWith(
                '- '
            )
        ) {
            return {
                type: 'list',
                text:
                    trimmed.slice(
                        2
                    )
            };
        }

        if (
            trimmed.startsWith(
                '> '
            )
        ) {
            return {
                type: 'quote',
                text:
                    trimmed.slice(
                        2
                    )
            };
        }

        if (
            trimmed.startsWith(
                '```'
            )
        ) {
            return {
                type: 'code-fence',
                text:
                    trimmed
            };
        }

        return {
            type: 'paragraph',
            text: trimmed
        };
    }

    toCharacterVectors(
        tokens
    ) {
        const vectors = [];

        for (
            let i = 0;
            i < tokens.length;
            i += 1
        ) {
            const token =
                tokens[i];

            const characters =
                [];

            for (
                let j = 0;
                j < token.text.length;
                j += 1
            ) {
                characters.push({
                    char:
                        token.text[j],
                    x: j,
                    y: i,
                    z: 0,
                    type:
                        token.type
                });
            }

            vectors.push(
                ...characters
            );
        }

        return vectors;
    }

    getTokens() {
        return [
            ...this.tokens
        ];
    }

    clear() {
        this.tokens.length = 0;
    }
} 
