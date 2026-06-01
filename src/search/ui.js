import { search } from "./indexer.js";
import { Storage } from "../storage/local.js";

export class SearchUI {

    constructor() {

        this.storage =
            new Storage();

        this.overlay = null;

        this.input = null;

        this.results = null;

        this.suggestions = null;

        this.selectedIndex = -1;

        this.debounceTimer = null;

        this.maxHistory = 10;
    }

    initialize() {

        this.overlay =
            document.getElementById(
                "search-overlay"
            );

        this.input =
            document.getElementById(
                "search-input"
            );

        this.results =
            document.getElementById(
                "search-results"
            );

        this.suggestions =
            document.getElementById(
                "search-suggestions"
            );

        if (
            !this.input
        ) {

            return;
        }

        this.attachEvents();

        this.renderRecentSearches();
    }

    attachEvents() {

        this.input.addEventListener(

            "input",

            event => {

                const value =
                    event.target.value;

                this.debounce(
                    () => {

                        this.performSearch(
                            value
                        );

                    },

                    150
                );
            }
        );

        this.input.addEventListener(

            "keydown",

            event => {

                this.handleKeyboard(
                    event
                );
            }
        );

        document.addEventListener(

            "keydown",

            event => {

                if (
                    (
                        event.ctrlKey ||
                        event.metaKey
                    ) &&
                    event.key === "k"
                ) {

                    event.preventDefault();

                    this.open();
                }

                if (
                    event.key ===
                    "Escape"
                ) {

                    this.close();
                }
            }
        );
    }

    debounce(
        callback,
        delay
    ) {

        clearTimeout(
            this.debounceTimer
        );

        this.debounceTimer =
            setTimeout(
                callback,
                delay
            );
    }

    performSearch(
        query
    ) {

        query =
            query.trim();

        if (
            !query
        ) {

            this.renderRecentSearches();

            return;
        }

        const results =
            search.search(
                query
            );

        const suggestions =
            search.suggestions(
                query
            );

        this.renderSuggestions(
            suggestions
        );

        this.renderResults(
            results
        );
    }

    renderResults(
        results = []
    ) {

        if (
            !this.results
        ) {

            return;
        }

        if (
            !results.length
        ) {

            this.results.innerHTML = `
<div
class="search-empty">

No results found

</div>
`;

            return;
        }

        this.results.innerHTML =
            results.map(

                item => {

                    return `
<a
href="${item.url}"
class="search-result">

<h3>
${this.escape(
    item.title
)}
</h3>

<p>
${item.highlights}
</p>

</a>
`;
                }

            ).join("");
    }

    renderSuggestions(
        suggestions = []
    ) {

        if (
            !this.suggestions
        ) {

            return;
        }

        this.selectedIndex =
            -1;

        this.suggestions.innerHTML =
            suggestions.map(

                value => {

                    return `
<button
type="button"
class="search-suggestion"
data-value="${this.escape(
    value
)}">

${this.escape(
    value
)}

</button>
`;
                }

            ).join("");

        this.suggestions
            .querySelectorAll(
                ".search-suggestion"
            )

            .forEach(button => {

                button.addEventListener(

                    "click",

                    () => {

                        this.input.value =
                            button.dataset
                                .value;

                        this.performSearch(
                            button.dataset
                                .value
                        );
                    }
                );
            });
    }

    handleKeyboard(
        event
    ) {

        const items =
            [
                ...document.querySelectorAll(
                    ".search-suggestion"
                )
            ];

        if (
            !items.length
        ) {

            return;
        }

        if (
            event.key ===
            "ArrowDown"
        ) {

            event.preventDefault();

            this.selectedIndex =
                Math.min(
                    items.length - 1,
                    this.selectedIndex + 1
                );

            this.highlightSelection(
                items
            );
        }

        if (
            event.key ===
            "ArrowUp"
        ) {

            event.preventDefault();

            this.selectedIndex =
                Math.max(
                    0,
                    this.selectedIndex - 1
                );

            this.highlightSelection(
                items
            );
        }

        if (
            event.key ===
            "Enter"
        ) {

            const selected =
                items[
                    this.selectedIndex
                ];

            if (
                selected
            ) {

                selected.click();
            }
        }
    }

    highlightSelection(
        items
    ) {

        items.forEach(

            (
                item,
                index
            ) => {

                item.classList.toggle(

                    "active",

                    index ===
                    this.selectedIndex
                );
            }
        );
    }

    saveSearch(
        query
    ) {

        const history =
            this.storage.get(
                "search-history",
                []
            );

        const updated = [

            query,

            ...history.filter(
                value =>
                    value !== query
            )

        ].slice(
            0,
            this.maxHistory
        );

        this.storage.set(

            "search-history",

            updated
        );
    }

    getHistory() {

        return this.storage.get(

            "search-history",

            []
        );
    }

    renderRecentSearches() {

        const history =
            this.getHistory();

        if (
            !this.results
        ) {

            return;
        }

        if (
            !history.length
        ) {

            this.results.innerHTML = `
<div
class="search-history-empty">

No recent searches

</div>
`;

            return;
        }

        this.results.innerHTML =
            history.map(

                value => {

                    return `
<button
type="button"
class="history-item"
data-query="${this.escape(
    value
)}">

${this.escape(
    value
)}

</button>
`;
                }

            ).join("");

        this.results
            .querySelectorAll(
                ".history-item"
            )

            .forEach(button => {

                button.addEventListener(

                    "click",

                    () => {

                        const query =
                            button.dataset
                                .query;

                        this.input.value =
                            query;

                        this.performSearch(
                            query
                        );
                    }
                );
            });
    }

    open() {

        if (
            !this.overlay
        ) {

            return;
        }

        this.overlay.hidden =
            false;

        this.input?.focus();
    }

    close() {

        if (
            !this.overlay
        ) {

            return;
        }

        this.overlay.hidden =
            true;
    }

    escape(
        value = ""
    ) {

        return String(value)

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                `"`,
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#39;"
            );
    }
}

export const searchUI =
    new SearchUI();

export default SearchUI; 
