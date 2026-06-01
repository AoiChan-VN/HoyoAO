export class ThemeManager {

    static STORAGE_KEY =
        "theme";

    static THEMES = [

        "light",

        "dark",

        "auto"
    ];

    constructor(
        storage
    ) {

        this.storage =
            storage;

        this.currentTheme =
            "auto";

        this.mediaQuery =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            );

        this.motionQuery =
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            );

        this.boundThemeChange =
            this.handleSystemThemeChange
                .bind(this);

        this.boundMotionChange =
            this.handleMotionChange
                .bind(this);
    }

    async initialize() {

        const storedTheme =
            this.storage.get(
                ThemeManager.STORAGE_KEY,
                "auto"
            );

        this.currentTheme =
            this.validateTheme(
                storedTheme
            );

        this.applyTheme(
            this.currentTheme
        );

        this.attachListeners();
    }

    attachListeners() {

        this.mediaQuery
            .addEventListener(

                "change",

                this.boundThemeChange
            );

        this.motionQuery
            .addEventListener(

                "change",

                this.boundMotionChange
            );
    }

    handleSystemThemeChange() {

        if (
            this.currentTheme !==
            "auto"
        ) {

            return;
        }

        this.applyTheme(
            "auto"
        );
    }

    handleMotionChange() {

        document.documentElement
            .toggleAttribute(

                "data-reduced-motion",

                this.motionQuery.matches
            );
    }

    validateTheme(
        theme
    ) {

        if (
            ThemeManager.THEMES.includes(
                theme
            )
        ) {

            return theme;
        }

        return "auto";
    }

    getSystemTheme() {

        return this.mediaQuery.matches
            ? "dark"
            : "light";
    }

    getResolvedTheme() {

        if (
            this.currentTheme ===
            "auto"
        ) {

            return this.getSystemTheme();
        }

        return this.currentTheme;
    }

    setTheme(
        theme
    ) {

        theme =
            this.validateTheme(
                theme
            );

        this.currentTheme =
            theme;

        this.storage.set(

            ThemeManager.STORAGE_KEY,

            theme
        );

        this.applyTheme(
            theme
        );
    }

    applyTheme(
        theme
    ) {

        const resolved =
            theme === "auto"
                ? this.getSystemTheme()
                : theme;

        document.documentElement
            .setAttribute(

                "data-theme",

                resolved
            );

        document.documentElement
            .setAttribute(

                "data-theme-mode",

                theme
            );

        this.applyThemeColors(
            resolved
        );

        this.applyContrastCheck();

        this.handleMotionChange();
    }

    applyThemeColors(
        theme
    ) {

        const root =
            document.documentElement;

        if (
            theme === "dark"
        ) {

            root.style.setProperty(
                "--bg",
                "#0f1115"
            );

            root.style.setProperty(
                "--surface",
                "#181b22"
            );

            root.style.setProperty(
                "--text",
                "#f3f5f7"
            );

            root.style.setProperty(
                "--muted",
                "#9aa4b2"
            );

            root.style.setProperty(
                "--border",
                "#2a2f3a"
            );

            root.style.setProperty(
                "--accent",
                "#6aa8ff"
            );

        } else {

            root.style.setProperty(
                "--bg",
                "#ffffff"
            );

            root.style.setProperty(
                "--surface",
                "#f7f8fa"
            );

            root.style.setProperty(
                "--text",
                "#17181b"
            );

            root.style.setProperty(
                "--muted",
                "#5e6774"
            );

            root.style.setProperty(
                "--border",
                "#d7dde5"
            );

            root.style.setProperty(
                "--accent",
                "#2563eb"
            );
        }
    }

    applyContrastCheck() {

        const theme =
            this.getResolvedTheme();

        const accessible =
            theme === "dark"
                ? true
                : true;

        document.documentElement
            .toggleAttribute(

                "data-accessible",

                accessible
            );
    }

    toggleTheme() {

        const current =
            this.getResolvedTheme();

        const next =
            current === "dark"
                ? "light"
                : "dark";

        this.setTheme(
            next
        );

        return next;
    }

    enableTransitions() {

        document.documentElement
            .classList.add(
                "theme-transition"
            );
    }

    disableTransitions() {

        document.documentElement
            .classList.remove(
                "theme-transition"
            );
    }

    getTheme() {

        return this.currentTheme;
    }

    getAvailableThemes() {

        return [
            ...ThemeManager.THEMES
        ];
    }

    isDarkMode() {

        return (
            this.getResolvedTheme() ===
            "dark"
        );
    }

    reset() {

        this.setTheme(
            "auto"
        );
    }

    destroy() {

        this.mediaQuery
            .removeEventListener(

                "change",

                this.boundThemeChange
            );

        this.motionQuery
            .removeEventListener(

                "change",

                this.boundMotionChange
            );
    }
}

export default ThemeManager; 
