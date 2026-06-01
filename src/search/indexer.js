export class SearchEngine {

    constructor() {

        this.index = new Map();

        this.documents = new Map();

        this.cache = new Map();

        this.stopwords =
            new Set([
                "và",
                "là",
                "của",
                "cho",
                "với",
                "trong",
                "được",
                "một",
                "các",
                "những",
                "the",
                "a",
                "an",
                "of",
                "to",
                "in",
                "for"
            ]);

        this.initialized =
            false;
    }

    async initialize() {

        if (
            this.initialized
        ) {

            return;
        }

        await this.loadIndexes();

        this.initialized =
            true;
    }

    async loadIndexes() {

        try {

            const response =
                await fetch(
                    "/cache/search.index.json",
                    {
                        cache:
                            "no-cache"
                    }
                );

            if (
                !response.ok
            ) {

                return;
            }

            const documents =
                await response.json();

            for (
                const document
                of documents
            ) {

                this.addDocument(
                    document
                );
            }

        } catch (error) {

            console.error(
                "[Search]",
                error
            );
        }
    }

    addDocument(
        document
    ) {

        if (
            !document?.id
        ) {

            return;
        }

        this.documents.set(

            document.id,

            document
        );

        const content =
            [
                document.title,
                document.description,
                document.content
            ]
            .filter(Boolean)
            .join(" ");

        const tokens =
            this.tokenize(
                content
            );

        for (
            const token
            of tokens
        ) {

            if (
                !this.index.has(
                    token
                )
            ) {

                this.index.set(
                    token,
                    new Set()
                );
            }

            this.index
                .get(token)
                .add(
                    document.id
                );
        }
    }

    removeDocument(
        id
    ) {

        const document =
            this.documents.get(
                id
            );

        if (
            !document
        ) {

            return;
        }

        const content =
            [
                document.title,
                document.description,
                document.content
            ]
            .join(" ");

        const tokens =
            this.tokenize(
                content
            );

        for (
            const token
            of tokens
        ) {

            const bucket =
                this.index.get(
                    token
                );

            if (
                bucket
            ) {

                bucket.delete(id);

                if (
                    !bucket.size
                ) {

                    this.index.delete(
                        token
                    );
                }
            }
        }

        this.documents.delete(
            id
        );
    }

    tokenize(
        text = ""
    ) {

        return text

            .toLowerCase()

            .normalize("NFD")

            .replace(
                /[\u0300-\u036f]/g,
                ""
            )

            .replace(
                /[^a-z0-9\u00C0-\u024F\s]/g,
                " "
            )

            .split(
                /\s+/
            )

            .filter(
                token =>
                    token &&
                    !this.stopwords.has(
                        token
                    )
            );
    }

    search(
        query,
        options = {}
    ) {

        if (
            !query
        ) {

            return [];
        }

        const cacheKey =
            JSON.stringify({
                query,
                options
            });

        if (
            this.cache.has(
                cacheKey
            )
        ) {

            return this.cache.get(
                cacheKey
            );
        }

        const tokens =
            this.tokenize(
                query
            );

        const scores =
            new Map();

        for (
            const token
            of tokens
        ) {

            const exact =
                this.index.get(
                    token
                );

            if (
                exact
            ) {

                for (
                    const id
                    of exact
                ) {

                    scores.set(

                        id,

                        (
                            scores.get(
                                id
                            ) || 0
                        ) + 10
                    );
                }
            }

            this.applyFuzzySearch(

                token,

                scores
            );
        }

        const results =
            [
                ...scores.entries()
            ]

            .sort(
                (
                    a,
                    b
                ) =>
                    b[1] -
                    a[1]
            )

            .map(
                (
                    [id, score]
                ) => {

                    const document =
                        this.documents.get(
                            id
                        );

                    return {

                        ...document,

                        score,

                        highlights:
                            this.highlight(
                                document,
                                tokens
                            )
                    };
                }
            );

        this.cache.set(
            cacheKey,
            results
        );

        return results;
    }

    applyFuzzySearch(
        token,
        scores
    ) {

        for (
            const [
                indexedToken,
                ids
            ]
            of this.index
        ) {

            const distance =
                this.levenshtein(

                    token,

                    indexedToken
                );

            if (
                distance > 2
            ) {

                continue;
            }

            for (
                const id
                of ids
            ) {

                scores.set(

                    id,

                    (
                        scores.get(
                            id
                        ) || 0
                    ) + 3
                );
            }
        }
    }

    highlight(
        document,
        tokens
    ) {

        const text =
            document.content ??
            "";

        let snippet =
            text.slice(
                0,
                250
            );

        for (
            const token
            of tokens
        ) {

            const regex =
                new RegExp(
                    `(${token})`,
                    "gi"
                );

            snippet =
                snippet.replace(
                    regex,
                    "<mark>$1</mark>"
                );
        }

        return snippet;
    }

    suggestions(
        query,
        limit = 5
    ) {

        const tokens =
            this.tokenize(
                query
            );

        const suggestions =
            new Set();

        for (
            const token
            of tokens
        ) {

            for (
                const indexed
                of this.index.keys()
            ) {

                if (
                    indexed.startsWith(
                        token
                    )
                ) {

                    suggestions.add(
                        indexed
                    );
                }
            }
        }

        return [
            ...suggestions
        ]
            .slice(
                0,
                limit
            );
    }

    levenshtein(
        a,
        b
    ) {

        const matrix =
            [];

        for (
            let i = 0;
            i <= b.length;
            i++
        ) {

            matrix[i] = [i];
        }

        for (
            let j = 0;
            j <= a.length;
            j++
        ) {

            matrix[0][j] = j;
        }

        for (
            let i = 1;
            i <= b.length;
            i++
        ) {

            for (
                let j = 1;
                j <= a.length;
                j++
            ) {

                if (
                    b.charAt(
                        i - 1
                    ) ===
                    a.charAt(
                        j - 1
                    )
                ) {

                    matrix[i][j] =
                        matrix[
                            i - 1
                        ][
                            j - 1
                        ];

                } else {

                    matrix[i][j] =
                        Math.min(

                            matrix[
                                i - 1
                            ][j - 1] + 1,

                            matrix[i][
                                j - 1
                            ] + 1,

                            matrix[
                                i - 1
                            ][j] + 1
                        );
                }
            }
        }

        return matrix[
            b.length
        ][
            a.length
        ];
    }

    reindex(
        documents = []
    ) {

        this.index.clear();

        this.documents.clear();

        for (
            const document
            of documents
        ) {

            this.addDocument(
                document
            );
        }
    }

    statistics() {

        return {

            documents:
                this.documents.size,

            tokens:
                this.index.size,

            cache:
                this.cache.size
        };
    }

    clearCache() {

        this.cache.clear();
    }
}

export const search =
    new SearchEngine();

export default SearchEngine; 
