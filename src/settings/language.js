export class LanguageManager {

    static STORAGE_KEY =
        "language";

    static DEFAULT_LANGUAGE =
        "en";

    constructor(
        storage
    ) {

        this.storage =
            storage;

        this.currentLanguage =
            LanguageManager
                .DEFAULT_LANGUAGE;

        this.translations =
            new Map();

        this.loadedLanguages =
            new Set();

        this.formatters =
            new Map();
    }

    async initialize() {

        const savedLanguage =
            this.storage.get(

                LanguageManager
                    .STORAGE_KEY,

                this.detectLanguage()
            );

        await this.setLanguage(
            savedLanguage
        );
    }

    detectLanguage() {

        const browserLanguage =
            navigator.language
                ?.split("-")[0];

        return (
            browserLanguage ||
            LanguageManager
                .DEFAULT_LANGUAGE
        );
    }

    async setLanguage(
        language
    ) {

        language =
            String(
                language
            )
                .toLowerCase();

        try {

            await this.loadLanguage(
                language
            );

            this.currentLanguage =
                language;

            this.storage.set(

                LanguageManager
                    .STORAGE_KEY,

                language
            );

            document.documentElement
                .setAttribute(

                    "lang",

                    language
                );

            this.dispatchChange();

        } catch {

            if (
                language !==
                LanguageManager
                    .DEFAULT_LANGUAGE
            ) {

                await this.setLanguage(

                    LanguageManager
                        .DEFAULT_LANGUAGE
                );
            }
        }
    }

    async loadLanguage(
        language
    ) {

        if (
            this.loadedLanguages.has(
                language
            )
        ) {

            return;
        }

        const response =
            await fetch(

                `/locales/${language}.json`,

                {
                    cache:
                        "force-cache"
                }
            );

        if (
            !response.ok
        ) {

            throw new Error(
                `Language Not Found: ${language}`
            );
        }

        const translations =
            await response.json();

        this.translations.set(

            language,

            translations
        );

        this.loadedLanguages.add(
            language
        );
    }

    t(
        key,
        replacements = {}
    ) {

        const locale =
            this.translations.get(

                this.currentLanguage
            ) || {};

        let value =
            key
                .split(".")
                .reduce(

                    (
                        current,
                        segment
                    ) => {

                        return current?.[
                            segment
                        ];
                    },

                    locale
                );

        if (
            value ===
            undefined
        ) {

            return key;
        }

        if (
            typeof value !==
            "string"
        ) {

            return String(
                value
            );
        }

        for (
            const [
                token,
                replacement
            ]
            of Object.entries(
                replacements
            )
        ) {

            value =
                value.replaceAll(

                    `{${token}}`,

                    String(
                        replacement
                    )
                );
        }

        return value;
    }

    plural(
        key,
        count
    ) {

        const rules =
            new Intl.PluralRules(

                this.currentLanguage
            );

        const category =
            rules.select(
                count
            );

        return this.t(

            `${key}.${category}`,

            {
                count
            }
        );
    }

    number(
        value,
        options = {}
    ) {

        return new Intl.NumberFormat(

            this.currentLanguage,

            options
        ).format(
            value
        );
    }

    currency(
        value,
        currency = "USD"
    ) {

        return new Intl.NumberFormat(

            this.currentLanguage,

            {

                style:
                    "currency",

                currency
            }

        ).format(
            value
        );
    }

    date(
        value,
        options = {}
    ) {

        return new Intl.DateTimeFormat(

            this.currentLanguage,

            options
        ).format(
            new Date(
                value
            )
        );
    }

    relativeTime(
        value,
        unit = "day"
    ) {

        const formatter =
            new Intl.RelativeTimeFormat(

                this.currentLanguage,

                {
                    numeric:
                        "auto"
                }
            );

        return formatter.format(

            value,

            unit
        );
    }

    has(
        key
    ) {

        const locale =
            this.translations.get(

                this.currentLanguage
            );

        if (
            !locale
        ) {

            return false;
        }

        return (
            key
                .split(".")
                .reduce(

                    (
                        current,
                        segment
                    ) =>
                        current?.[
                            segment
                        ],

                    locale
                ) !==
            undefined
        );
    }

    getLanguage() {

        return this.currentLanguage;
    }

    getLoadedLanguages() {

        return [
            ...this.loadedLanguages
        ];
    }

    async preload(
        languages = []
    ) {

        await Promise.all(

            languages.map(
                language =>

                    this.loadLanguage(
                        language
                    )
            )
        );
    }

    dispatchChange() {

        document.dispatchEvent(

            new CustomEvent(

                "aoi:language-change",

                {

                    detail: {

                        language:
                            this.currentLanguage
                    }
                }
            )
        );
    }

    destroy() {

        this.translations.clear();

        this.loadedLanguages.clear();

        this.formatters.clear();
    }
}

export default LanguageManager; 
