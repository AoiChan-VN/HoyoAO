export class TOCManager {

    constructor() {

        this.container =
            document.getElementById(
                "table-of-contents"
            );

        this.observer = null;

        this.headings = [];

        this.activeAnchor =
            null;
    }

    initialize(toc = []) {

        if (
            !this.container
        ) {

            return;
        }

        this.destroy();

        this.render(toc);

        this.collectHeadings();

        this.observe();

        this.attachNavigation();
    }

    render(toc) {

        if (
            !Array.isArray(toc)
        ) {

            return;
        }

        const items =
            toc.map(item => {

                const level =
                    Number(
                        item.level
                    );

                return `
<li
class="toc-item"
data-level="${level}">
<a
href="#${item.anchor}"
data-anchor="${item.anchor}">
${this.escape(item.text)}
</a>
</li>
`;
            }).join("");

        this.container.innerHTML = `
<nav
class="toc-nav"
aria-label="Table of Contents">

<ul class="toc-list">
${items}
</ul>

</nav>
`;
    }

    collectHeadings() {

        this.headings =
            [
                ...document.querySelectorAll(
                    "[data-anchor]"
                )
            ];
    }

    observe() {

        if (
            !(
                "IntersectionObserver"
                in window
            )
        ) {

            return;
        }

        this.observer =
            new IntersectionObserver(

                entries => {

                    for (
                        const entry
                        of entries
                    ) {

                        if (
                            !entry.isIntersecting
                        ) {

                            continue;
                        }

                        const anchor =
                            entry.target
                                .dataset
                                .anchor;

                        this.setActive(
                            anchor
                        );
                    }
                },

                {

                    root: null,

                    rootMargin:
                        "-20% 0px -60% 0px",

                    threshold: 0
                }
            );

        for (
            const heading
            of this.headings
        ) {

            this.observer.observe(
                heading
            );
        }
    }

    attachNavigation() {

        this.container
            .querySelectorAll(
                "a[data-anchor]"
            )

            .forEach(anchor => {

                anchor.addEventListener(

                    "click",

                    event => {

                        event.preventDefault();

                        const target =
                            anchor.dataset
                                .anchor;

                        this.scrollTo(
                            target
                        );
                    },

                    {
                        passive: false
                    }
                );
            });
    }

    scrollTo(anchor) {

        const target =
            document.getElementById(
                anchor
            );

        if (
            !target
        ) {

            return;
        }

        target.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"
        });

        history.replaceState(

            {},

            "",

            `#${anchor}`
        );
    }

    setActive(anchor) {

        if (
            this.activeAnchor ===
            anchor
        ) {

            return;
        }

        this.activeAnchor =
            anchor;

        this.container
            .querySelectorAll(
                "a[data-anchor]"
            )

            .forEach(link => {

                const active =
                    link.dataset
                        .anchor ===
                    anchor;

                link.classList.toggle(
                    "active",
                    active
                );

                if (active) {

                    link.setAttribute(
                        "aria-current",
                        "location"
                    );

                } else {

                    link.removeAttribute(
                        "aria-current"
                    );
                }
            });

        this.syncHash(anchor);
    }

    syncHash(anchor) {

        if (
            !anchor
        ) {

            return;
        }

        history.replaceState(

            {},

            "",

            `#${anchor}`
        );
    }

    expandToHash() {

        const hash =
            location.hash
                .replace("#", "")
                .trim();

        if (!hash) {

            return;
        }

        requestAnimationFrame(
            () => {

                this.scrollTo(
                    hash
                );
            }
        );
    }

    refresh() {

        this.collectHeadings();

        this.observe();
    }

    escape(value = "") {

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

    destroy() {

        if (
            this.observer
        ) {

            this.observer.disconnect();

            this.observer =
                null;
        }

        this.headings = [];

        this.activeAnchor =
            null;
    }
}

export const toc =
    new TOCManager();

export default TOCManager; 
