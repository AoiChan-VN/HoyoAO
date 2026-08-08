
const APP_CONFIG = Object.freeze({
    storageKey: "portfolio.settings.v1",
    defaultSettings: Object.freeze({
        theme: "system",
        panelTheme: "glass",
        background: "gradient-mesh",
        motion: true,
        smoothScroll: true,
        backgroundMotion: true,
        contrast: false,
        fontScale: 100,
    }),
    searchLimit: 50,
    toastDuration: 5000,
    articleWordsPerMinute: 200,
    selectors: Object.freeze({
        root: "#app",
        html: "html",
        body: "body",
        header: "[data-header]",
        routeLinks: "[data-route-link]",
        sections: "[data-observe-section]",
        navigationLists: "[data-navigation-list]",
        dialogs: "[data-dialog]",
        openDialog: "[data-open-dialog]",
        closeDialog: "[data-close-dialog]",
        drawer: "[data-drawer]",
        openDrawer: "[data-open-drawer]",
        closeDrawer: "[data-close-drawer]",
        projectList: "[data-project-list]",
        articleList: "[data-article-list]",
        projectFilters: "[data-project-filters]",
        articleFilters: "[data-article-filters]",
        projectFilter: "[data-project-filter]",
        articleFilter: "[data-article-filter]",
        projectView: "[data-project-view]",
        articleSort: "[data-article-sort]",
        searchForm: "[data-search-form]",
        searchInput: "[data-search-input]",
        clearSearch: "[data-clear-search]",
        searchScope: "[data-search-scope]",
        searchResults: "[data-search-results]",
        searchStatus: "[data-search-status]",
        contentDialog: "#content-dialog",
        contentDialogTitle: "[data-content-dialog-title]",
        contentDialogCategory: "[data-content-dialog-category]",
        contentDialogDate: "[data-content-dialog-date]",
        contentDialogReadingTime: "[data-content-dialog-reading-time]",
        contentDialogCover: "[data-content-dialog-cover]",
        contentDialogBody: "[data-content-dialog-body]",
        contentDialogTags: "[data-content-dialog-tags]",
        shareContent: "[data-share-content]",
        toastRegion: "[data-toast-region]",
        toastTemplate: "#toast-template",
        projectTemplate: "#project-card-template",
        articleTemplate: "#article-card-template",
        searchResultTemplate: "#search-result-template",
        toastTemplateElement: "[data-toast]",
        connectionStatus: "[data-connection-status]",
        connectionStatusText: "[data-connection-status-text]",
        pageProgress: "#page-progress",
        pageProgressBar: ".page-progress__bar",
        backToTop: "[data-back-to-top]",
        siteName: "[data-site-name]",
        siteMark: "[data-site-mark]",
        siteTagline: "[data-site-tagline]",
        heroEyebrow: "[data-hero-eyebrow]",
        heroTitle: "[data-hero-title]",
        heroDescription: "[data-hero-description]",
        heroStatistics: "[data-hero-statistics]",
        aboutSummary: "[data-about-summary]",
        aboutContent: "[data-about-content]",
        profileMedia: "[data-profile-media]",
        profileRole: "[data-profile-role]",
        profileName: "[data-profile-name]",
        skillList: "[data-skill-list]",
        technologyList: "[data-technology-list]",
        contactTitle: "[data-contact-title]",
        contactDescription: "[data-contact-description]",
        contactActions: "[data-contact-actions]",
        contactLinks: "[data-contact-links]",
        footerDescription: "[data-footer-description]",
        socialLinks: "[data-social-links]",
        currentYear: "[data-current-year]",
        themeOption: "[data-theme-option]",
        panelThemeOption: "[data-panel-theme-option]",
        backgroundOption: "[data-background-option]",
        motionToggle: "[data-motion-toggle]",
        smoothScrollToggle: "[data-smooth-scroll-toggle]",
        backgroundMotionToggle: "[data-background-motion-toggle]",
        contrastToggle: "[data-contrast-toggle]",
        fontScaleControl: "[data-font-scale-control]",
        fontScaleOutput: "[data-font-scale-output]",
        resetSettings: "[data-reset-settings]",
        emptyState: "[data-empty-state]",
        contentStatus: "[data-content-status]",
        projectStatus: "[data-content-status='projects']",
        articleStatus: "[data-content-status='articles']",
    }),
});

const ICON_PATHS = Object.freeze({
    github:
        "M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.61-3.37-1.19-3.37-1.19-.46-1.17-1.11-1.48-1.11-1.48-.91-.63.07-.62.07-.62 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.67-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 8.15c.85 0 1.7.12 2.49.36 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.69 1.03 1.58 1.03 2.67 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z",
    linkedin:
        "M6.5 8.5A2 2 0 1 0 6.5 4a2 2 0 0 0 0 4.5ZM5 10h3v9H5v-9Zm5 0h2.88v1.23h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.6V19h-3v-4.18c0-1-.02-2.29-1.4-2.29-1.4 0-1.61 1.09-1.61 2.21V19h-3v-9Z",
    twitter:
        "M21.5 6.1c-.7.3-1.45.5-2.24.59a3.9 3.9 0 0 0 1.71-2.16 7.75 7.75 0 0 1-2.47.94A3.88 3.88 0 0 0 11.7 8.1c0 .3.03.6.1.88A11.01 11.01 0 0 1 3.8 5.05a3.88 3.88 0 0 0 1.2 5.18 3.86 3.86 0 0 1-1.76-.49v.05a3.88 3.88 0 0 0 3.1 3.8 3.9 3.9 0 0 1-1.75.07 3.89 3.89 0 0 0 3.63 2.7A7.8 7.8 0 0 1 2.4 18.02 11 11 0 0 0 8.37 19.77c7.16 0 11.08-5.93 11.08-11.08 0-.17 0-.34-.01-.5a7.9 7.9 0 0 0 2.06-2.09Z",
    website:
        "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18c2.25 2.4 3.38 5.4 3.38 9S14.25 18.6 12 21c-2.25-2.4-3.38-5.4-3.38-9S9.75 5.4 12 3ZM3 12h18M4.5 7.5h15M4.5 16.5h15",
    mail:
        "M3 5h18v14H3V5Zm0 1 9 7 9-7",
    external:
        "M14 5h5v5M19 5l-8 8M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
    link:
        "M10.6 13.4a4 4 0 0 0 5.66 0l2-2a4 4 0 0 0-5.66-5.66l-1.15 1.15M13.4 10.6a4 4 0 0 0-5.66 0l-2 2a4 4 0 0 0 5.66 5.66l1.15-1.15",
    check:
        "m5 12 4 4L19 6",
    info:
        "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-10v5m0-9h.01",
    success:
        "M20 6 9 17l-5-5",
    warning:
        "M12 3 2 21h20L12 3Zm0 6v5m0 4h.01",
    error:
        "M6 6l12 12M18 6 6 18",
    search:
        "m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
});

const app = {
    root: null,
    html: null,
    body: null,
    settings: { ...APP_CONFIG.defaultSettings },
    data: {
        site: null,
        navigation: null,
        projects: [],
        articles: [],
        backgrounds: [],
    },
    caches: {
        articleContent: new Map(),
        imageStates: new WeakMap(),
    },
    state: {
        activeRoute: "",
        activeProjectFilter: "all",
        activeArticleFilter: "all",
        projectView: "grid",
        articleSort: "newest",
        searchScope: "all",
        searchQuery: "",
        searchRequestId: 0,
        currentContent: null,
        previousFocus: null,
        drawerFocus: null,
        dialogRequests: new Map(),
    },
    ui: {
        header: null,
        pageProgress: null,
        pageProgressBar: null,
        projectList: null,
        articleList: null,
        projectFilters: null,
        articleFilters: null,
        searchInput: null,
        searchResults: null,
        searchStatus: null,
        contentDialog: null,
        toastRegion: null,
        connectionStatus: null,
        connectionStatusText: null,
    },
    observers: {
        section: null,
        reveal: null,
    },
};

document.addEventListener("DOMContentLoaded", () => {
    void initializeApplication();
});

async function initializeApplication() {
    cacheDom();
    loadPersistedSettings();
    applySettingsToDocument();
    bindGlobalEvents();
    initializeRouteState();
    initializeObservers();
    initializeConnectionState();
    initializeCurrentYear();

    const [siteResult, navigationResult, projectsResult, articlesResult, backgroundsResult] =
        await Promise.allSettled([
            loadJsonFromElement("data-site-config"),
            loadJsonFromElement("data-navigation-config"),
            loadJsonFromElement("data-projects-source"),
            loadJsonFromElement("data-articles-source"),
            loadJsonFromElement("data-backgrounds-source"),
        ]);

    app.data.site = normalizeSiteData(
        siteResult.status === "fulfilled" ? siteResult.value : null,
    );

    app.data.navigation = normalizeNavigationData(
        navigationResult.status === "fulfilled" ? navigationResult.value : null,
    );

    app.data.projects = normalizeProjectsData(
        projectsResult.status === "fulfilled" ? projectsResult.value : null,
    );

    app.data.articles = normalizeArticlesData(
        articlesResult.status === "fulfilled" ? articlesResult.value : null,
    );

    app.data.backgrounds = normalizeBackgroundsData(
        backgroundsResult.status === "fulfilled" ? backgroundsResult.value : null,
    );

    renderSiteData();
    renderNavigation();
    renderBackgroundOptions();
    renderProjectFilters();
    renderArticleFilters();
    renderProjects();
    renderArticles();
    renderSocialLinks();
    renderCurrentSection();
    initializeSearchIndex();

    if (window.location.hash) {
        requestAnimationFrame(() => {
            scrollToHash(window.location.hash, false);
        });
    }

    document.documentElement.classList.add("is-ready");
}

function cacheDom() {
    app.root = document.querySelector(APP_CONFIG.selectors.root);
    app.html = document.querySelector(APP_CONFIG.selectors.html);
    app.body = document.querySelector(APP_CONFIG.selectors.body);

    app.ui.header = document.querySelector(APP_CONFIG.selectors.header);
    app.ui.pageProgress = document.querySelector(APP_CONFIG.selectors.pageProgress);
    app.ui.pageProgressBar = document.querySelector(APP_CONFIG.selectors.pageProgressBar);
    app.ui.projectList = document.querySelector(APP_CONFIG.selectors.projectList);
    app.ui.articleList = document.querySelector(APP_CONFIG.selectors.articleList);
    app.ui.projectFilters = document.querySelector(APP_CONFIG.selectors.projectFilters);
    app.ui.articleFilters = document.querySelector(APP_CONFIG.selectors.articleFilters);
    app.ui.searchInput = document.querySelector(APP_CONFIG.selectors.searchInput);
    app.ui.searchResults = document.querySelector(APP_CONFIG.selectors.searchResults);
    app.ui.searchStatus = document.querySelector(APP_CONFIG.selectors.searchStatus);
    app.ui.contentDialog = document.querySelector(APP_CONFIG.selectors.contentDialog);
    app.ui.toastRegion = document.querySelector(APP_CONFIG.selectors.toastRegion);
    app.ui.connectionStatus = document.querySelector(APP_CONFIG.selectors.connectionStatus);
    app.ui.connectionStatusText = document.querySelector(APP_CONFIG.selectors.connectionStatusText);
}

function bindGlobalEvents() {
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleDocumentKeydown);
    document.addEventListener("scroll", handleDocumentScroll, { passive: true });
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("online", handleOnlineState);
    window.addEventListener("offline", handleOfflineState);
    window.addEventListener("resize", handleWindowResize, { passive: true });

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            updateScrollProgress();
            updateHeaderState();
        }
    });
}

function handleDocumentClick(event) {
    const routeLink = event.target.closest(APP_CONFIG.selectors.routeLinks);

    if (routeLink) {
        const route = routeLink.dataset.routeLink;

        if (route) {
            event.preventDefault();
            closeAllTransientLayers();

            const hash = `#${route}`;

            if (window.location.hash !== hash) {
                history.pushState(
                    { route },
                    "",
                    hash,
                );
            }

            scrollToHash(hash, true);
            updateNavigationState(route);
            return;
        }
    }

    const openDialogButton = event.target.closest(APP_CONFIG.selectors.openDialog);

    if (openDialogButton) {
        const dialogId = openDialogButton.dataset.openDialog;

        if (dialogId) {
            event.preventDefault();
            openDialog(dialogId);
            return;
        }
    }

    const closeDialogButton = event.target.closest(APP_CONFIG.selectors.closeDialog);

    if (closeDialogButton) {
        const dialogId = closeDialogButton.dataset.closeDialog;

        if (dialogId) {
            event.preventDefault();
            closeDialog(dialogId);
            return;
        }
    }

    const openDrawerButton = event.target.closest(APP_CONFIG.selectors.openDrawer);

    if (openDrawerButton) {
        const drawerId = openDrawerButton.dataset.openDrawer;

        if (drawerId) {
            event.preventDefault();
            openDrawer(drawerId);
            return;
        }
    }

    const closeDrawerButton = event.target.closest(APP_CONFIG.selectors.closeDrawer);

    if (closeDrawerButton) {
        const drawerId = closeDrawerButton.dataset.closeDrawer;

        if (drawerId) {
            event.preventDefault();
            closeDrawer(drawerId);
            return;
        }
    }

    const projectFilter = event.target.closest(APP_CONFIG.selectors.projectFilter);

    if (projectFilter && app.ui.projectFilters?.contains(projectFilter)) {
        setProjectFilter(projectFilter.dataset.projectFilter || "all");
        return;
    }

    const articleFilter = event.target.closest(APP_CONFIG.selectors.articleFilter);

    if (articleFilter && app.ui.articleFilters?.contains(articleFilter)) {
        setArticleFilter(articleFilter.dataset.articleFilter || "all");
        return;
    }

    const projectView = event.target.closest(APP_CONFIG.selectors.projectView);

    if (projectView) {
        setProjectView(projectView.dataset.projectView || "grid");
        return;
    }

    const projectOpenButton = event.target.closest("[data-project-open]");

    if (projectOpenButton) {
        const card = projectOpenButton.closest("[data-project-card]");

        if (card?.dataset.projectId) {
            const project = findProjectById(card.dataset.projectId);

            if (project) {
                openProject(project);
            }
        }

        return;
    }

    const articleOpenButton = event.target.closest("[data-article-open]");

    if (articleOpenButton) {
        const card = articleOpenButton.closest("[data-article-card]");

        if (card?.dataset.articleId) {
            const article = findArticleById(card.dataset.articleId);

            if (article) {
                void openArticle(article);
            }
        }

        return;
    }

    const searchResultButton = event.target.closest("[data-search-result]");

    if (searchResultButton) {
        const type = searchResultButton.dataset.searchResultType;
        const id = searchResultButton.dataset.searchResultId;

        if (type === "project" && id) {
            const project = findProjectById(id);

            if (project) {
                closeDialog("search-dialog");
                openProject(project);
            }
        }

        if (type === "article" && id) {
            const article = findArticleById(id);

            if (article) {
                closeDialog("search-dialog");
                void openArticle(article);
            }
        }

        return;
    }

    const searchScopeButton = event.target.closest(APP_CONFIG.selectors.searchScope);

    if (searchScopeButton) {
        setSearchScope(searchScopeButton.dataset.searchScope || "all");
        return;
    }

    const clearSearchButton = event.target.closest(APP_CONFIG.selectors.clearSearch);

    if (clearSearchButton) {
        clearSearch();
        return;
    }

    const backToTop = event.target.closest(APP_CONFIG.selectors.backToTop);

    if (backToTop) {
        event.preventDefault();
        scrollToTop();
        return;
    }

    const shareButton = event.target.closest(APP_CONFIG.selectors.shareContent);

    if (shareButton) {
        void shareCurrentContent();
        return;
    }

    const resetSettingsButton = event.target.closest(APP_CONFIG.selectors.resetSettings);

    if (resetSettingsButton) {
        resetSettings();
        return;
    }

    const toastClose = event.target.closest("[data-toast-close]");

    if (toastClose) {
        const toast = toastClose.closest("[data-toast]");

        if (toast) {
            dismissToast(toast);
        }
    }
}

function handleDocumentKeydown(event) {
    if (event.key === "Escape") {
        const openDrawerElement = document.querySelector(
            `${APP_CONFIG.selectors.drawer}.is-open`,
        );

        if (openDrawerElement) {
            closeDrawer(openDrawerElement.id);
            return;
        }

        const openDialogElement = document.querySelector(
            "dialog[open][data-dialog]",
        );

        if (openDialogElement) {
            closeDialog(openDialogElement.id);
            return;
        }
    }

    if (
        event.key === "/" &&
        !isTypingContext(event.target) &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
    ) {
        event.preventDefault();
        openDialog("search-dialog");
    }

    if (
        event.key.toLowerCase() === "k" &&
        (event.ctrlKey || event.metaKey) &&
        !event.altKey
    ) {
        event.preventDefault();
        openDialog("search-dialog");
    }

    if (
        event.key === "Tab" &&
        document.querySelector(".navigation-drawer.is-open")
    ) {
        trapFocusInContainer(
            event,
            document.querySelector(".navigation-drawer.is-open .navigation-drawer__panel"),
        );
    }

    if (
        event.key === "Tab" &&
        document.querySelector("dialog[open][data-dialog]")
    ) {
        trapFocusInContainer(
            event,
            document.querySelector("dialog[open][data-dialog] .app-dialog__panel"),
        );
    }
}

function handleDocumentScroll() {
    updateScrollProgress();
    updateHeaderState();
}

function handleHashChange() {
    const route = getRouteFromHash();

    if (route) {
        scrollToHash(`#${route}`, true);
        updateNavigationState(route);
    }
}

function handleOnlineState() {
    setConnectionState(true);
}

function handleOfflineState() {
    setConnectionState(false);
}

function handleWindowResize() {
    if (window.innerWidth > 960) {
        const drawer = document.querySelector(".navigation-drawer.is-open");

        if (drawer) {
            closeDrawer(drawer.id);
        }
    }
}

function initializeCurrentYear() {
    const currentYear = String(new Date().getFullYear());

    document
        .querySelectorAll(APP_CONFIG.selectors.currentYear)
        .forEach((element) => {
            element.textContent = currentYear;
            element.setAttribute("datetime", currentYear);
        });
}

function initializeConnectionState() {
    setConnectionState(navigator.onLine);
}

function setConnectionState(isOnline) {
    if (!app.ui.connectionStatus) {
        return;
    }

    if (isOnline) {
        app.ui.connectionStatus.hidden = true;
        return;
    }

    app.ui.connectionStatus.hidden = false;

    if (app.ui.connectionStatusText) {
        app.ui.connectionStatusText.textContent =
            "Không có kết nối mạng. Website vẫn có thể sử dụng dữ liệu đã tải.";
    }
}

function initializeRouteState() {
    app.state.activeRoute = getRouteFromHash() || "home";
    updateNavigationState(app.state.activeRoute);
}

function getRouteFromHash() {
    const rawHash = window.location.hash.replace(/^#/, "").trim();

    if (!rawHash) {
        return "";
    }

    const normalized = decodeURIComponent(rawHash);

    return document.getElementById(normalized)
        ? normalized
        : "";
}

function scrollToHash(hash, updateHistory) {
    const targetId = hash.replace(/^#/, "");
    const target = document.getElementById(targetId);

    if (!target) {
        return;
    }

    if (updateHistory && window.location.hash !== hash) {
        history.pushState(
            { route: targetId },
            "",
            hash,
        );
    }

    target.scrollIntoView({
        behavior: getScrollBehavior(),
        block: "start",
    });

    updateNavigationState(targetId);
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: getScrollBehavior(),
    });

    history.replaceState(
        { route: "home" },
        "",
        "#home",
    );

    updateNavigationState("home");
}

function getScrollBehavior() {
    return app.settings.smoothScroll &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "smooth"
        : "auto";
}

function updateNavigationState(route) {
    app.state.activeRoute = route;

    document
        .querySelectorAll(APP_CONFIG.selectors.routeLinks)
        .forEach((link) => {
            const isActive = link.dataset.routeLink === route;

            link.classList.toggle("is-active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
}

function initializeObservers() {
    if ("IntersectionObserver" in window) {
        app.observers.section = new IntersectionObserver(
            handleSectionIntersection,
            {
                root: null,
                rootMargin: "-35% 0px -50% 0px",
                threshold: 0,
            },
        );

        document
            .querySelectorAll(APP_CONFIG.selectors.sections)
            .forEach((section) => {
                app.observers.section.observe(section);
            });

        app.observers.reveal = new IntersectionObserver(
            handleRevealIntersection,
            {
                root: null,
                rootMargin: "0px 0px -8% 0px",
                threshold: 0.05,
            },
        );

        document
            .querySelectorAll(
                ".surface-card, .section-header, .hero-section__content, .hero-statistics",
            )
            .forEach((element) => {
                element.classList.add("is-pending");
                app.observers.reveal.observe(element);
            });
    } else {
        document
            .querySelectorAll(APP_CONFIG.selectors.sections)
            .forEach((section) => {
                section.classList.add("is-visible");
            });
    }
}

function handleSectionIntersection(entries) {
    const visibleEntries = entries.filter((entry) => entry.isIntersecting);

    if (!visibleEntries.length) {
        return;
    }

    const activeEntry = visibleEntries
        .sort(
            (a, b) =>
                b.intersectionRatio - a.intersectionRatio,
        )[0];

    const route = activeEntry.target.dataset.pageSection;

    if (route) {
        updateNavigationState(route);

        if (
            window.location.hash !== `#${route}` &&
            window.scrollY > 150
        ) {
            history.replaceState(
                { route },
                "",
                `#${route}`,
            );
        }
    }
}

function handleRevealIntersection(entries) {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) {
            return;
        }

        entry.target.classList.remove("is-pending");
        entry.target.classList.add("is-visible");

        app.observers.reveal?.unobserve(entry.target);
    });
}

function renderCurrentSection() {
    const route = getRouteFromHash() || "home";
    updateNavigationState(route);
}

function updateScrollProgress() {
    if (!app.ui.pageProgressBar) {
        return;
    }

    const scrollableHeight =
        document.documentElement.scrollHeight -
        window.innerHeight;

    const progress =
        scrollableHeight > 0
            ? Math.min(
                  1,
                  Math.max(
                      0,
                      window.scrollY / scrollableHeight,
                  ),
              )
            : 0;

    app.ui.pageProgressBar.style.transform =
        `scaleX(${progress})`;

    app.ui.pageProgress?.setAttribute(
        "aria-valuenow",
        String(Math.round(progress * 100)),
    );
}

function updateHeaderState() {
    app.ui.header?.classList.toggle(
        "is-scrolled",
        window.scrollY > 16,
    );
}

function loadPersistedSettings() {
    try {
        const raw = localStorage.getItem(APP_CONFIG.storageKey);

        if (!raw) {
            app.settings = {
                ...APP_CONFIG.defaultSettings,
            };
            return;
        }

        const parsed = JSON.parse(raw);

        app.settings = sanitizeSettings({
            ...APP_CONFIG.defaultSettings,
            ...parsed,
        });
    } catch {
        app.settings = {
            ...APP_CONFIG.defaultSettings,
        };
    }
}

function persistSettings() {
    try {
        localStorage.setItem(
            APP_CONFIG.storageKey,
            JSON.stringify(app.settings),
        );
    } catch {
        return;
    }
}

function sanitizeSettings(settings) {
    const allowedThemes = new Set([
        "system",
        "light",
        "dark",
    ]);

    const allowedPanelThemes = new Set([
        "glass",
        "solid",
        "outline",
        "elevated",
    ]);

    const allowedBackgrounds = new Set([
        "gradient-mesh",
        "midnight-grid",
        "soft-aurora",
        "minimal",
    ]);

    const theme = allowedThemes.has(settings.theme)
        ? settings.theme
        : APP_CONFIG.defaultSettings.theme;

    const panelTheme = allowedPanelThemes.has(settings.panelTheme)
        ? settings.panelTheme
        : APP_CONFIG.defaultSettings.panelTheme;

    const background = allowedBackgrounds.has(settings.background)
        ? settings.background
        : APP_CONFIG.defaultSettings.background;

    const fontScaleNumber = Number(settings.fontScale);

    const fontScale = Number.isFinite(fontScaleNumber)
        ? Math.min(
              120,
              Math.max(
                  90,
                  Math.round(fontScaleNumber / 5) * 5,
              ),
          )
        : APP_CONFIG.defaultSettings.fontScale;

    return {
        theme,
        panelTheme,
        background,
        motion: Boolean(settings.motion),
        smoothScroll: Boolean(settings.smoothScroll),
        backgroundMotion: Boolean(settings.backgroundMotion),
        contrast: Boolean(settings.contrast),
        fontScale,
    };
}

function applySettingsToDocument() {
    const html = document.documentElement;

    html.dataset.theme = app.settings.theme;
    html.dataset.panelTheme = app.settings.panelTheme;
    html.dataset.background = app.settings.background;
    html.dataset.motion = app.settings.motion
        ? "full"
        : "none";
    html.dataset.smoothScroll = String(
        app.settings.smoothScroll,
    );
    html.dataset.backgroundMotion = String(
        app.settings.backgroundMotion,
    );
    html.dataset.highContrast = String(
        app.settings.contrast,
    );

    html.style.setProperty(
        "--font-scale",
        String(app.settings.fontScale / 100),
    );

    syncSettingsControls();
}

function syncSettingsControls() {
    document
        .querySelectorAll(APP_CONFIG.selectors.themeOption)
        .forEach((input) => {
            input.checked =
                input.value === app.settings.theme;
        });

    document
        .querySelectorAll(APP_CONFIG.selectors.panelThemeOption)
        .forEach((input) => {
            input.checked =
                input.value === app.settings.panelTheme;
        });

    document
        .querySelectorAll(APP_CONFIG.selectors.backgroundOption)
        .forEach((input) => {
            input.checked =
                input.value === app.settings.background;
        });

    const motionToggle = document.querySelector(
        APP_CONFIG.selectors.motionToggle,
    );

    if (motionToggle) {
        motionToggle.checked = app.settings.motion;
    }

    const smoothScrollToggle = document.querySelector(
        APP_CONFIG.selectors.smoothScrollToggle,
    );

    if (smoothScrollToggle) {
        smoothScrollToggle.checked =
            app.settings.smoothScroll;
    }

    const backgroundMotionToggle = document.querySelector(
        APP_CONFIG.selectors.backgroundMotionToggle,
    );

    if (backgroundMotionToggle) {
        backgroundMotionToggle.checked =
            app.settings.backgroundMotion;
    }

    const contrastToggle = document.querySelector(
        APP_CONFIG.selectors.contrastToggle,
    );

    if (contrastToggle) {
        contrastToggle.checked =
            app.settings.contrast;
    }

    const fontScaleControl = document.querySelector(
        APP_CONFIG.selectors.fontScaleControl,
    );

    if (fontScaleControl) {
        fontScaleControl.value =
            String(app.settings.fontScale);
    }

    updateFontScaleOutput();
}

function updateSettingsFromControl(control) {
    if (!control) {
        return;
    }

    if (control.matches(APP_CONFIG.selectors.themeOption)) {
        app.settings.theme = control.value;
    }

    if (control.matches(APP_CONFIG.selectors.panelThemeOption)) {
        app.settings.panelTheme = control.value;
    }

    if (control.matches(APP_CONFIG.selectors.backgroundOption)) {
        app.settings.background = control.value;
    }

    if (control.matches(APP_CONFIG.selectors.motionToggle)) {
        app.settings.motion = control.checked;
    }

    if (control.matches(APP_CONFIG.selectors.smoothScrollToggle)) {
        app.settings.smoothScroll = control.checked;
    }

    if (control.matches(APP_CONFIG.selectors.backgroundMotionToggle)) {
        app.settings.backgroundMotion = control.checked;
    }

    if (control.matches(APP_CONFIG.selectors.contrastToggle)) {
        app.settings.contrast = control.checked;
    }

    if (control.matches(APP_CONFIG.selectors.fontScaleControl)) {
        app.settings.fontScale = Number(control.value);
    }

    app.settings = sanitizeSettings(app.settings);

    applySettingsToDocument();
    persistSettings();

    if (
        control.matches(
            `${APP_CONFIG.selectors.themeOption}, ${APP_CONFIG.selectors.panelThemeOption}, ${APP_CONFIG.selectors.backgroundOption}`,
        )
    ) {
        showToast(
            "success",
            "Đã cập nhật giao diện",
            "Thiết lập mới đã được áp dụng.",
        );
    }
}

function resetSettings() {
    app.settings = {
        ...APP_CONFIG.defaultSettings,
    };

    applySettingsToDocument();
    persistSettings();

    showToast(
        "success",
        "Đã khôi phục",
        "Giao diện đã trở về thiết lập mặc định.",
    );
}

function updateFontScaleOutput() {
    const output = document.querySelector(
        APP_CONFIG.selectors.fontScaleOutput,
    );

    if (output) {
        output.textContent =
            `${app.settings.fontScale}%`;
    }
}

function renderSiteData() {
    const site = app.data.site;

    if (!site) {
        return;
    }

    setTextForSelector(
        APP_CONFIG.selectors.siteName,
        site.name,
    );

    setTextForSelector(
        APP_CONFIG.selectors.siteMark,
        site.mark || getInitial(site.name),
    );

    setTextForSelector(
        APP_CONFIG.selectors.siteTagline,
        site.tagline,
    );

    setTextForSelector(
        APP_CONFIG.selectors.heroEyebrow,
        site.hero?.eyebrow,
    );

    setTextForSelector(
        APP_CONFIG.selectors.heroTitle,
        site.hero?.title,
    );

    setTextForSelector(
        APP_CONFIG.selectors.heroDescription,
        site.hero?.description,
    );

    setTextForSelector(
        APP_CONFIG.selectors.aboutSummary,
        site.about?.summary,
    );

    setTextForSelector(
        APP_CONFIG.selectors.profileRole,
        site.profile?.role,
    );

    setTextForSelector(
        APP_CONFIG.selectors.profileName,
        site.profile?.name,
    );

    setTextForSelector(
        APP_CONFIG.selectors.contactTitle,
        site.contact?.title,
    );

    setTextForSelector(
        APP_CONFIG.selectors.contactDescription,
        site.contact?.description,
    );

    setTextForSelector(
        APP_CONFIG.selectors.footerDescription,
        site.footer?.description,
    );

    renderHeroStatistics(site.hero?.statistics);
    renderAboutContent(site.about?.content);
    renderProfileMedia(site.profile?.image);
    renderSkills(site.skills);
    renderTechnologies(site.technologies);
    renderContact(site.contact);
}

function renderHeroStatistics(statistics) {
    const container = document.querySelector(
        APP_CONFIG.selectors.heroStatistics,
    );

    if (!container) {
        return;
    }

    container.replaceChildren();

    if (!Array.isArray(statistics) || statistics.length === 0) {
        container.hidden = true;
        return;
    }

    statistics.forEach((item) => {
        const normalized = normalizeStatistic(item);

        if (!normalized) {
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "hero-statistics__item";

        const value = document.createElement("dt");
        value.className = "hero-statistics__value";
        value.textContent = normalized.value;

        const label = document.createElement("dd");
        label.className = "hero-statistics__label";
        label.textContent = normalized.label;

        wrapper.append(value, label);
        container.append(wrapper);
    });

    container.hidden = container.children.length === 0;
}

function renderAboutContent(content) {
    const container = document.querySelector(
        APP_CONFIG.selectors.aboutContent,
    );

    if (!container || content == null) {
        return;
    }

    const html = renderContentValue(content);

    if (!html) {
        return;
    }

    container.innerHTML = html;
}

function renderProfileMedia(imageSource) {
    const container = document.querySelector(
        APP_CONFIG.selectors.profileMedia,
    );

    if (!container || !imageSource) {
        return;
    }

    const url = sanitizeUrl(imageSource);

    if (!url) {
        return;
    }

    const image = document.createElement("img");

    image.src = url;
    image.alt =
        app.data.site?.profile?.name ||
        app.data.site?.name ||
        "Ảnh hồ sơ";
    image.loading = "lazy";
    image.decoding = "async";

    image.addEventListener(
        "error",
        () => {
            image.remove();
        },
        { once: true },
    );

    container.prepend(image);
}

function renderSkills(skills) {
    const container = document.querySelector(
        APP_CONFIG.selectors.skillList,
    );

    if (!container) {
        return;
    }

    container.replaceChildren();

    if (!Array.isArray(skills) || skills.length === 0) {
        return;
    }

    skills.forEach((item) => {
        const normalized = normalizeSkill(item);

        if (!normalized) {
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "skill-item";

        const header = document.createElement("div");
        header.className = "skill-item__header";

        const name = document.createElement("span");
        name.className = "skill-item__name";
        name.textContent = normalized.name;

        const value = document.createElement("span");
        value.className = "skill-item__value";
        value.textContent = `${normalized.level}%`;

        const track = document.createElement("div");
        track.className = "skill-item__track";

        const bar = document.createElement("span");
        bar.className = "skill-item__bar";
        bar.style.setProperty(
            "--skill-level",
            `${normalized.level}%`,
        );

        track.append(bar);
        header.append(name, value);
        wrapper.append(header, track);

        container.append(wrapper);
    });
}

function renderTechnologies(technologies) {
    const container = document.querySelector(
        APP_CONFIG.selectors.technologyList,
    );

    if (!container) {
        return;
    }

    container.replaceChildren();

    if (!Array.isArray(technologies) || technologies.length === 0) {
        return;
    }

    technologies.forEach((technology) => {
        const name = normalizePlainText(
            typeof technology === "string"
                ? technology
                : technology?.name,
        );

        if (!name) {
            return;
        }

        const item = document.createElement("li");
        item.textContent = name;

        container.append(item);
    });
}

function renderContact(contact) {
    const actionContainer = document.querySelector(
        APP_CONFIG.selectors.contactActions,
    );

    const linksContainer = document.querySelector(
        APP_CONFIG.selectors.contactLinks,
    );

    if (actionContainer) {
        actionContainer.replaceChildren();

        const primaryAction = normalizeContactAction(
            contact?.primaryAction,
        );

        if (primaryAction) {
            actionContainer.append(
                createActionButton(
                    primaryAction,
                    "button button--primary",
                ),
            );
        }

        const secondaryAction = normalizeContactAction(
            contact?.secondaryAction,
        );

        if (secondaryAction) {
            actionContainer.append(
                createActionButton(
                    secondaryAction,
                    "button button--secondary",
                ),
            );
        }
    }

    if (!linksContainer) {
        return;
    }

    linksContainer.replaceChildren();

    if (!Array.isArray(contact?.links)) {
        return;
    }

    contact.links.forEach((item) => {
        const normalized = normalizeContactLink(item);

        if (!normalized) {
            return;
        }

        linksContainer.append(
            createContactLink(normalized),
        );
    });
}

function renderNavigation() {
    if (!app.data.navigation) {
        return;
    }

    const items = Array.isArray(app.data.navigation)
        ? app.data.navigation
        : app.data.navigation.items;

    if (!Array.isArray(items) || items.length === 0) {
        return;
    }

    document
        .querySelectorAll(APP_CONFIG.selectors.navigationLists)
        .forEach((container) => {
            const isMobile =
                container.dataset.navigationList === "mobile";

            container.replaceChildren();

            items.forEach((item, index) => {
                const normalized = normalizeNavigationItem(item);

                if (!normalized) {
                    return;
                }

                const listItem = document.createElement("li");
                listItem.className =
                    isMobile
                        ? "mobile-navigation__item"
                        : "desktop-navigation__item";

                const link = document.createElement("a");

                link.className =
                    isMobile
                        ? "mobile-navigation__link"
                        : "desktop-navigation__link";

                link.href = `#${normalized.route}`;
                link.dataset.routeLink =
                    normalized.route;

                if (isMobile) {
                    const label = document.createElement("span");
                    label.textContent =
                        normalized.label;

                    const number = document.createElement("span");
                    number.setAttribute(
                        "aria-hidden",
                        "true",
                    );
                    number.textContent =
                        String(index + 1).padStart(
                            2,
                            "0",
                        );

                    link.append(label, number);
                } else {
                    link.textContent =
                        normalized.label;
                }

                listItem.append(link);
                container.append(listItem);
            });
        });

    updateNavigationState(
        app.state.activeRoute ||
            getRouteFromHash() ||
            "home",
    );
}

function renderBackgroundOptions() {
    const container = document.querySelector(
        "[data-background-options]",
    );

    if (!container) {
        return;
    }

    if (
        !Array.isArray(app.data.backgrounds) ||
        app.data.backgrounds.length === 0
    ) {
        syncSettingsControls();
        return;
    }

    container.replaceChildren();

    app.data.backgrounds.forEach((background) => {
        const normalized =
            normalizeBackgroundItem(background);

        if (!normalized) {
            return;
        }

        const label = document.createElement("label");
        label.className =
            "background-option";

        const input = document.createElement("input");
        input.className =
            "background-option__input";
        input.type = "radio";
        input.name = "background";
        input.value = normalized.id;
        input.dataset.backgroundOption = "";

        const preview = document.createElement("span");
        preview.className =
            "background-option__preview";

        if (normalized.previewClass) {
            preview.classList.add(
                normalized.previewClass,
            );
        }

        const text = document.createElement("span");
        text.className =
            "background-option__label";
        text.textContent =
            normalized.label;

        label.append(
            input,
            preview,
            text,
        );

        container.append(label);
    });

    syncSettingsControls();
}

function renderSocialLinks() {
    const links =
        app.data.site?.socialLinks ||
        app.data.site?.socials;

    document
        .querySelectorAll(APP_CONFIG.selectors.socialLinks)
        .forEach((container) => {
            container.replaceChildren();

            if (!Array.isArray(links)) {
                return;
            }

            links.forEach((item) => {
                const normalized =
                    normalizeSocialLink(item);

                if (!normalized) {
                    return;
                }

                container.append(
                    createSocialLink(normalized),
                );
            });
        });
}

function renderProjectFilters() {
    if (!app.ui.projectFilters) {
        return;
    }

    const categories =
        collectCategories(app.data.projects);

    preserveFirstFilterButton(
        app.ui.projectFilters,
        "project-filter-all",
    );

    categories.forEach((category) => {
        const button =
            createFilterButton(
                category,
                "project",
            );

        app.ui.projectFilters.append(button);
    });

    updateFilterButtonState(
        app.ui.projectFilters,
        "project",
        app.state.activeProjectFilter,
    );
}

function renderArticleFilters() {
    if (!app.ui.articleFilters) {
        return;
    }

    const categories =
        collectCategories(app.data.articles);

    preserveFirstFilterButton(
        app.ui.articleFilters,
        "article-filter-all",
    );

    categories.forEach((category) => {
        const button =
            createFilterButton(
                category,
                "article",
            );

        app.ui.articleFilters.append(button);
    });

    updateFilterButtonState(
        app.ui.articleFilters,
        "article",
        app.state.activeArticleFilter,
    );
}

function renderProjects() {
    const container = app.ui.projectList;

    if (!container) {
        return;
    }

    const filteredProjects =
        getFilteredProjects();

    container.setAttribute(
        "aria-busy",
        "false",
    );

    container.dataset.view =
        app.state.projectView;

    container.replaceChildren();

    const status = document.querySelector(
        APP_CONFIG.selectors.projectStatus,
    );

    if (status) {
        status.hidden =
            app.data.projects.length === 0;
    }

    if (app.data.projects.length === 0) {
        showEmptyState("projects", true);
        return;
    }

    showEmptyState(
        "projects",
        filteredProjects.length === 0,
    );

    filteredProjects.forEach((project) => {
        container.append(
            createProjectCard(project),
        );
    });
}

function renderArticles() {
    const container = app.ui.articleList;

    if (!container) {
        return;
    }

    const filteredArticles =
        getFilteredArticles();

    container.setAttribute(
        "aria-busy",
        "false",
    );

    container.replaceChildren();

    const status = document.querySelector(
        APP_CONFIG.selectors.articleStatus,
    );

    if (status) {
        status.hidden =
            app.data.articles.length === 0;
    }

    if (app.data.articles.length === 0) {
        showEmptyState("articles", true);
        return;
    }

    showEmptyState(
        "articles",
        filteredArticles.length === 0,
    );

    filteredArticles.forEach((article) => {
        container.append(
            createArticleCard(article),
        );
    });
}

function createProjectCard(project) {
    const template = document.querySelector(
        APP_CONFIG.selectors.projectTemplate,
    );

    if (!template) {
        throw new Error(
            "Không tìm thấy template project card.",
        );
    }

    const fragment =
        template.content.cloneNode(true);

    const card =
        fragment.querySelector("[data-project-card]");

    const image =
        fragment.querySelector("[data-project-image]");

    const category =
        fragment.querySelector("[data-project-category]");

    const date =
        fragment.querySelector("[data-project-date]");

    const title =
        fragment.querySelector("[data-project-title]");

    const description =
        fragment.querySelector("[data-project-description]");

    const status =
        fragment.querySelector("[data-project-status]");

    const technologies =
        fragment.querySelector(
            "[data-project-technologies]",
        );

    const links =
        fragment.querySelector(
            "[data-project-links]",
        );

    card.dataset.projectId =
        project.id;

    if (image && project.image) {
        const url = sanitizeUrl(project.image);

        if (url) {
            image.src = url;
            image.alt =
                project.imageAlt ||
                project.title;

            image.addEventListener(
                "error",
                () => {
                    image.hidden = true;
                    card.classList.add(
                        "project-card--no-image",
                    );
                },
                { once: true },
            );
        } else {
            image.hidden = true;
        }
    } else if (image) {
        image.hidden = true;
    }

    if (category) {
        category.textContent =
            project.category || "";
    }

    if (date) {
        setDateElement(
            date,
            project.date,
        );
    }

    if (title) {
        title.textContent =
            project.title;
    }

    if (description) {
        description.textContent =
            project.description;
    }

    if (status) {
        if (project.status) {
            status.textContent =
                project.status;
            status.hidden = false;
        } else {
            status.hidden = true;
        }
    }

    if (technologies) {
        project.technologies
            .forEach((technology) => {
                const item =
                    document.createElement("li");

                item.textContent =
                    technology;

                technologies.append(item);
            });
    }

    if (links) {
        project.links.forEach((link) => {
            links.append(
                createProjectLink(link),
            );
        });
    }

    return fragment;
}

function createArticleCard(article) {
    const template = document.querySelector(
        APP_CONFIG.selectors.articleTemplate,
    );

    if (!template) {
        throw new Error(
            "Không tìm thấy template article card.",
        );
    }

    const fragment =
        template.content.cloneNode(true);

    const card =
        fragment.querySelector("[data-article-card]");

    const image =
        fragment.querySelector("[data-article-image]");

    const category =
        fragment.querySelector("[data-article-category]");

    const date =
        fragment.querySelector("[data-article-date]");

    const title =
        fragment.querySelector("[data-article-title]");

    const description =
        fragment.querySelector(
            "[data-article-description]",
        );

    const readingTime =
        fragment.querySelector(
            "[data-article-reading-time]",
        );

    card.dataset.articleId =
        article.id;

    if (image && article.image) {
        const url = sanitizeUrl(article.image);

        if (url) {
            image.src = url;
            image.alt =
                article.imageAlt ||
                article.title;

            image.addEventListener(
                "error",
                () => {
                    image.hidden = true;
                    card.classList.add(
                        "article-card--no-image",
                    );
                },
                { once: true },
            );
        } else {
            image.hidden = true;
        }
    } else if (image) {
        image.hidden = true;
    }

    if (category) {
        category.textContent =
            article.category || "";
    }

    if (date) {
        setDateElement(
            date,
            article.date,
        );
    }

    if (title) {
        title.textContent =
            article.title;
    }

    if (description) {
        description.textContent =
            article.description;
    }

    if (readingTime) {
        readingTime.textContent =
            formatReadingTime(
                article.readingTime,
            );
    }

    return fragment;
}

function createProjectLink(link) {
    const normalized =
        normalizeExternalLink(link);

    if (!normalized) {
        return document.createDocumentFragment();
    }

    const anchor =
        document.createElement("a");

    anchor.className =
        "project-card__link";

    anchor.href =
        normalized.url;

    anchor.target =
        normalized.external
            ? "_blank"
            : "_self";

    anchor.rel =
        normalized.external
            ? "noopener noreferrer"
            : "";

    anchor.setAttribute(
        "aria-label",
        normalized.label,
    );

    anchor.innerHTML =
        createIconSvg(
            normalized.icon ||
                "external",
        );

    return anchor;
}

function createFilterButton(category, type) {
    const button =
        document.createElement("button");

    button.className =
        "filter-tab";

    button.type = "button";

    button.role = "tab";

    button.dataset[
        type === "project"
            ? "projectFilter"
            : "articleFilter"
    ] = category;

    button.textContent =
        category;

    button.setAttribute(
        "aria-selected",
        "false",
    );

    return button;
}

function createActionButton(action, className) {
    const anchor =
        document.createElement("a");

    anchor.className =
        className;

    anchor.href =
        action.url;

    anchor.textContent =
        action.label;

    if (action.external) {
        anchor.target = "_blank";
        anchor.rel =
            "noopener noreferrer";
    }

    return anchor;
}

function createContactLink(item) {
    const anchor =
        document.createElement("a");

    anchor.className =
        "contact-link";

    anchor.href =
        item.url;

    if (item.external) {
        anchor.target = "_blank";
        anchor.rel =
            "noopener noreferrer";
    }

    const icon =
        document.createElement("span");

    icon.className =
        "contact-link__icon";

    icon.innerHTML =
        createIconSvg(
            item.icon || "link",
        );

    const content =
        document.createElement("span");

    content.className =
        "contact-link__content";

    const label =
        document.createElement("span");

    label.className =
        "contact-link__label";

    label.textContent =
        item.label;

    const value =
        document.createElement("strong");

    value.className =
        "contact-link__value";

    value.textContent =
        item.value;

    content.append(
        label,
        value,
    );

    anchor.append(
        icon,
        content,
    );

    return anchor;
}

function createSocialLink(item) {
    const anchor =
        document.createElement("a");

    anchor.className =
        "social-link";

    anchor.href =
        item.url;

    anchor.target =
        "_blank";

    anchor.rel =
        "noopener noreferrer";

    anchor.setAttribute(
        "aria-label",
        item.label,
    );

    anchor.innerHTML =
        `${createIconSvg(
            item.icon || "link",
        )}<span>${escapeHtml(
            item.label,
        )}</span>`;

    return anchor;
}

function createIconSvg(name) {
    const path =
        ICON_PATHS[name] ||
        ICON_PATHS.link;

    return `
        <svg
            class="icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                d="${path}"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
            ></path>
        </svg>
    `;
}

function setProjectFilter(filter) {
    app.state.activeProjectFilter =
        filter || "all";

    updateFilterButtonState(
        app.ui.projectFilters,
        "project",
        app.state.activeProjectFilter,
    );

    renderProjects();
}

function setArticleFilter(filter) {
    app.state.activeArticleFilter =
        filter || "all";

    updateFilterButtonState(
        app.ui.articleFilters,
        "article",
        app.state.activeArticleFilter,
    );

    renderArticles();
}

function setProjectView(view) {
    app.state.projectView =
        view === "list"
            ? "list"
            : "grid";

    if (app.ui.projectList) {
        app.ui.projectList.dataset.view =
            app.state.projectView;
    }

    document
        .querySelectorAll(APP_CONFIG.selectors.projectView)
        .forEach((button) => {
            const active =
                button.dataset.projectView ===
                app.state.projectView;

            button.classList.toggle(
                "is-active",
                active,
            );

            button.setAttribute(
                "aria-pressed",
                String(active),
            );
        });
}

function setArticleSort(sort) {
    const allowed = new Set([
        "newest",
        "oldest",
        "title-asc",
        "title-desc",
    ]);

    app.state.articleSort =
        allowed.has(sort)
            ? sort
            : "newest";

    renderArticles();
}

function getFilteredProjects() {
    if (
        app.state.activeProjectFilter ===
        "all"
    ) {
        return [...app.data.projects];
    }

    return app.data.projects.filter(
        (project) =>
            normalizeComparable(
                project.category,
            ) ===
            normalizeComparable(
                app.state.activeProjectFilter,
            ),
    );
}

function getFilteredArticles() {
    let articles = app.data.articles;

    if (
        app.state.activeArticleFilter !==
        "all"
    ) {
        articles =
            articles.filter(
                (article) =>
                    normalizeComparable(
                        article.category,
                    ) ===
                    normalizeComparable(
                        app.state.activeArticleFilter,
                    ),
            );
    }

    return [...articles].sort(
        createArticleSortComparator(
            app.state.articleSort,
        ),
    );
}

function createArticleSortComparator(sort) {
    if (sort === "oldest") {
        return (a, b) =>
            getTimestamp(a.date) -
            getTimestamp(b.date);
    }

    if (sort === "title-asc") {
        return (a, b) =>
            a.title.localeCompare(
                b.title,
                "vi",
                {
                    sensitivity:
                        "base",
                },
            );
    }

    if (sort === "title-desc") {
        return (a, b) =>
            b.title.localeCompare(
                a.title,
                "vi",
                {
                    sensitivity:
                        "base",
                },
            );
    }

    return (a, b) =>
        getTimestamp(b.date) -
        getTimestamp(a.date);
}

function updateFilterButtonState(
    container,
    type,
    activeValue,
) {
    if (!container) {
        return;
    }

    const selector =
        type === "project"
            ? APP_CONFIG.selectors.projectFilter
            : APP_CONFIG.selectors.articleFilter;

    container
        .querySelectorAll(selector)
        .forEach((button) => {
            const value =
                button.dataset[
                    type === "project"
                        ? "projectFilter"
                        : "articleFilter"
                ];

            const active =
                value === activeValue;

            button.classList.toggle(
                "is-active",
                active,
            );

            button.setAttribute(
                "aria-selected",
                String(active),
            );
        });
}

function preserveFirstFilterButton(
    container,
    id,
) {
    const first =
        container.querySelector(`#${id}`);

    if (!first) {
        return;
    }

    const clone =
        first.cloneNode(true);

    container.replaceChildren(clone);
}

function collectCategories(items) {
    const categories =
        new Set();

    items.forEach((item) => {
        const category =
            normalizePlainText(
                item.category,
            );

        if (category) {
            categories.add(category);
        }
    });

    return [...categories].sort(
        (a, b) =>
            a.localeCompare(
                b,
                "vi",
                {
                    sensitivity:
                        "base",
                },
            ),
    );
}

function showEmptyState(
    type,
    visible,
) {
    const state =
        document.querySelector(
            `[data-empty-state="${type}"]`,
        );

    if (state) {
        state.hidden = !visible;
    }
}

function initializeSearchIndex() {
    const form =
        document.querySelector(
            APP_CONFIG.selectors.searchForm,
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();
            void performSearch();
        },
    );

    app.ui.searchInput?.addEventListener(
        "input",
        debounce(
            () => {
                void performSearch();
            },
            180,
        ),
    );

    const sortSelect =
        document.querySelector(
            APP_CONFIG.selectors.articleSort,
        );

    sortSelect?.addEventListener(
        "change",
        () => {
            setArticleSort(
                sortSelect.value,
            );
        },
    );

    document
        .querySelectorAll(APP_CONFIG.selectors.themeOption)
        .forEach((input) => {
            input.addEventListener(
                "change",
                () => {
                    updateSettingsFromControl(
                        input,
                    );
                },
            );
        });

    document
        .querySelectorAll(
            APP_CONFIG.selectors.panelThemeOption,
        )
        .forEach((input) => {
            input.addEventListener(
                "change",
                () => {
                    updateSettingsFromControl(
                        input,
                    );
                },
            );
        });

    document
        .querySelectorAll(
            APP_CONFIG.selectors.backgroundOption,
        )
        .forEach((input) => {
            input.addEventListener(
                "change",
                () => {
                    updateSettingsFromControl(
                        input,
                    );
                },
            );
        });

    document
        .querySelectorAll(
            [
                APP_CONFIG.selectors.motionToggle,
                APP_CONFIG.selectors.smoothScrollToggle,
                APP_CONFIG.selectors.backgroundMotionToggle,
                APP_CONFIG.selectors.contrastToggle,
            ].join(","),
        )
        .forEach((input) => {
            input.addEventListener(
                "change",
                () => {
                    updateSettingsFromControl(
                        input,
                    );
                },
            );
        });

    const fontScaleControl =
        document.querySelector(
            APP_CONFIG.selectors.fontScaleControl,
        );

    fontScaleControl?.addEventListener(
        "input",
        () => {
            updateSettingsFromControl(
                fontScaleControl,
            );
            updateFontScaleOutput();
        },
    );
}

function setSearchScope(scope) {
    const allowed = new Set([
        "all",
        "projects",
        "articles",
    ]);

    app.state.searchScope =
        allowed.has(scope)
            ? scope
            : "all";

    document
        .querySelectorAll(
            APP_CONFIG.selectors.searchScope,
        )
        .forEach((button) => {
            const active =
                button.dataset.searchScope ===
                app.state.searchScope;

            button.classList.toggle(
                "is-active",
                active,
            );

            button.setAttribute(
                "aria-pressed",
                String(active),
            );
        });

    void performSearch();
}

function clearSearch() {
    if (app.ui.searchInput) {
        app.ui.searchInput.value = "";
        app.ui.searchInput.focus();
    }

    app.state.searchQuery = "";

    const clearButton =
        document.querySelector(
            APP_CONFIG.selectors.clearSearch,
        );

    if (clearButton) {
        clearButton.hidden = true;
    }

    renderSearchState(
        [],
        "Nhập từ khóa để bắt đầu tìm kiếm.",
    );
}

async function performSearch() {
    const query =
        normalizePlainText(
            app.ui.searchInput?.value,
        );

    app.state.searchQuery =
        query;

    const clearButton =
        document.querySelector(
            APP_CONFIG.selectors.clearSearch,
        );

    if (clearButton) {
        clearButton.hidden =
            query.length === 0;
    }

    if (query.length === 0) {
        renderSearchState(
            [],
            "Nhập từ khóa để bắt đầu tìm kiếm.",
        );
        return;
    }

    const requestId =
        ++app.state.searchRequestId;

    renderSearchState(
        [],
        "Đang tìm kiếm...",
    );

    const articleSearchEntries =
        app.state.searchScope === "projects"
            ? []
            : await buildArticleSearchEntries();

    if (
        requestId !==
        app.state.searchRequestId
    ) {
        return;
    }

    const projectEntries =
        app.state.searchScope === "articles"
            ? []
            : app.data.projects.map(
                  (project) => ({
                      type: "project",
                      id: project.id,
                      title: project.title,
                      description:
                          project.description,
                      category:
                          project.category,
                      tags:
                          project.technologies.join(
                              " ",
                          ),
                      text: [
                          project.title,
                          project.description,
                          project.category,
                          project.technologies.join(
                              " ",
                          ),
                      ]
                          .join(" ")
                          .toLocaleLowerCase(
                              "vi",
                          ),
                  }),
              );

    const entries = [
        ...projectEntries,
        ...articleSearchEntries,
    ];

    const results =
        entries
            .map((entry) => ({
                ...entry,
                score:
                    calculateSearchScore(
                        entry,
                        query,
                    ),
            }))
            .filter(
                (entry) =>
                    entry.score > 0,
            )
            .sort(
                (a, b) =>
                    b.score - a.score,
            )
            .slice(
                0,
                APP_CONFIG.searchLimit,
            );

    if (
        requestId !==
        app.state.searchRequestId
    ) {
        return;
    }

    if (results.length === 0) {
        renderSearchState(
            [],
            "Không tìm thấy kết quả phù hợp.",
        );
        return;
    }

    renderSearchState(
        results,
        `${results.length} kết quả được tìm thấy.`,
    );
}

async function buildArticleSearchEntries() {
    const results = [];

    for (
        const article of app.data.articles
    ) {
        let content = "";

        try {
            content =
                await loadArticleContent(
                    article,
                );
        } catch {
            content = "";
        }

        results.push({
            type: "article",
            id: article.id,
            title: article.title,
            description:
                article.description,
            category:
                article.category,
            tags:
                article.tags.join(" "),
            text: [
                article.title,
                article.description,
                article.category,
                article.tags.join(" "),
                content,
            ]
                .join(" ")
                .toLocaleLowerCase(
                    "vi",
                ),
        });
    }

    return results;
}

function calculateSearchScore(
    entry,
    query,
) {
    const normalizedQuery =
        query.toLocaleLowerCase(
            "vi",
        );

    const title =
        normalizeComparable(
            entry.title,
        );

    const category =
        normalizeComparable(
            entry.category,
        );

    const description =
        normalizeComparable(
            entry.description,
        );

    const tags =
        normalizeComparable(
            entry.tags,
        );

    const text =
        entry.text ||
        "";

    let score = 0;

    if (
        title.includes(
            normalizedQuery,
        )
    ) {
        score += 100;
    }

    if (
        title.startsWith(
            normalizedQuery,
        )
    ) {
        score += 75;
    }

    if (
        category.includes(
            normalizedQuery,
        )
    ) {
        score += 40;
    }

    if (
        tags.includes(
            normalizedQuery,
        )
    ) {
        score += 35;
    }

    if (
        description.includes(
            normalizedQuery,
        )
    ) {
        score += 25;
    }

    if (
        text.includes(
            normalizedQuery,
        )
    ) {
        score += 10;
    }

    const words =
        normalizedQuery
            .split(/\s+/)
            .filter(Boolean);

    if (words.length > 1) {
        words.forEach((word) => {
            if (title.includes(word)) {
                score += 20;
            }

            if (description.includes(word)) {
                score += 8;
            }

            if (text.includes(word)) {
                score += 3;
            }
        });
    }

    return score;
}

function renderSearchState(
    results,
    statusMessage,
) {
    if (app.ui.searchStatus) {
        app.ui.searchStatus.textContent =
            statusMessage;
    }

    if (!app.ui.searchResults) {
        return;
    }

    app.ui.searchResults.replaceChildren();

    results.forEach((result) => {
        app.ui.searchResults.append(
            createSearchResult(result),
        );
    });
}

function createSearchResult(result) {
    const template =
        document.querySelector(
            APP_CONFIG.selectors.searchResultTemplate,
        );

    if (!template) {
        throw new Error(
            "Không tìm thấy template search result.",
        );
    }

    const fragment =
        template.content.cloneNode(true);

    const button =
        fragment.querySelector(
            "[data-search-result]",
        );

    const type =
        fragment.querySelector(
            "[data-search-result-type]",
        );

    const title =
        fragment.querySelector(
            "[data-search-result-title]",
        );

    const description =
        fragment.querySelector(
            "[data-search-result-description]",
        );

    button.dataset.searchResultType =
        result.type;

    button.dataset.searchResultId =
        result.id;

    type.textContent =
        result.type === "project"
            ? "Dự án"
            : "Bài viết";

    title.textContent =
        result.title;

    description.textContent =
        result.description ||
        result.category ||
        "";

    return fragment;
}

function openProject(project) {
    openContentDialog({
        type: "project",
        id: project.id,
        title: project.title,
        category: project.category,
        date: project.date,
        readingTime:
            project.readingTime,
        cover: project.image,
        tags: project.technologies,
        content:
            project.content ||
            project.description,
    });
}

async function openArticle(article) {
    const dialog =
        app.ui.contentDialog;

    if (!dialog) {
        return;
    }

    openContentDialog({
        type: "article",
        id: article.id,
        title: article.title,
        category: article.category,
        date: article.date,
        readingTime:
            article.readingTime,
        cover: article.image,
        tags: article.tags,
        content: null,
    });

    setContentDialogBody(
        "Đang tải nội dung bài viết...",
    );

    try {
        const content =
            await loadArticleContent(
                article,
            );

        if (
            app.state.currentContent?.id !==
            article.id
        ) {
            return;
        }

        setContentDialogBody(
            renderContentValue(
                content,
                article.contentType,
            ),
        );
    } catch (error) {
        if (
            app.state.currentContent?.id !==
            article.id
        ) {
            return;
        }

        setContentDialogBody(
            createErrorContent(
                "Không thể tải nội dung bài viết.",
                error,
            ),
        );
    }
}

function openContentDialog(content) {
    app.state.currentContent =
        content;

    const dialog =
        app.ui.contentDialog;

    if (!dialog) {
        return;
    }

    const title =
        dialog.querySelector(
            APP_CONFIG.selectors.contentDialogTitle,
        );

    const category =
        dialog.querySelector(
            APP_CONFIG.selectors.contentDialogCategory,
        );

    const date =
        dialog.querySelector(
            APP_CONFIG.selectors.contentDialogDate,
        );

    const readingTime =
        dialog.querySelector(
            APP_CONFIG.selectors.contentDialogReadingTime,
        );

    const cover =
        dialog.querySelector(
            APP_CONFIG.selectors.contentDialogCover,
        );

    const tags =
        dialog.querySelector(
            APP_CONFIG.selectors.contentDialogTags,
        );

    if (title) {
        title.textContent =
            content.title;
    }

    if (category) {
        category.textContent =
            content.category ||
            (content.type === "article"
                ? "Bài viết"
                : "Dự án");
    }

    if (date) {
        setDateElement(
            date,
            content.date,
        );
    }

    if (readingTime) {
        readingTime.textContent =
            formatReadingTime(
                content.readingTime,
            );
    }

    if (cover) {
        renderContentDialogCover(
            cover,
            content.cover,
            content.title,
        );
    }

    if (tags) {
        renderContentDialogTags(
            tags,
            content.tags,
        );
    }

    setContentDialogBody(
        content.content
            ? renderContentValue(
                  content.content,
              )
            : "Đang tải nội dung...",
    );

    openDialog(
        "content-dialog",
    );
}

function setContentDialogBody(content) {
    const container =
        document.querySelector(
            APP_CONFIG.selectors.contentDialogBody,
        );

    if (!container) {
        return;
    }

    if (
        typeof content === "string" &&
        content.trim().startsWith("<")
    ) {
        container.innerHTML =
            content;
    } else {
        container.textContent =
            content || "";
    }
}

function renderContentDialogCover(
    container,
    source,
    alt,
) {
    container.replaceChildren();

    if (!source) {
        container.hidden = true;
        return;
    }

    const url =
        sanitizeUrl(source);

    if (!url) {
        container.hidden = true;
        return;
    }

    const image =
        document.createElement("img");

    image.src = url;
    image.alt =
        alt || "";
    image.loading = "lazy";
    image.decoding = "async";

    image.addEventListener(
        "error",
        () => {
            container.hidden = true;
            container.replaceChildren();
        },
        { once: true },
    );

    container.append(image);
    container.hidden = false;
}

function renderContentDialogTags(
    container,
    tags,
) {
    container.replaceChildren();

    if (!Array.isArray(tags)) {
        return;
    }

    tags.forEach((tag) => {
        const normalized =
            normalizePlainText(
                tag,
            );

        if (!normalized) {
            return;
        }

        const item =
            document.createElement("span");

        item.textContent =
            normalized;

        container.append(item);
    });
}

async function loadArticleContent(article) {
    if (
        app.caches.articleContent.has(
            article.id,
        )
    ) {
        return app.caches.articleContent.get(
            article.id,
        );
    }

    if (article.contentText) {
        app.caches.articleContent.set(
            article.id,
            article.contentText,
        );

        return article.contentText;
    }

    if (article.content) {
        const content =
            typeof article.content === "string"
                ? article.content
                : "";

        app.caches.articleContent.set(
            article.id,
            content,
        );

        return content;
    }

    if (!article.contentSource) {
        return "";
    }

    const url =
        resolveResourceUrl(
            article.contentSource,
        );

    const response =
        await fetch(
            url,
            {
                method: "GET",
                cache: "default",
                credentials: "same-origin",
            },
        );

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}`,
        );
    }

    const content =
        await response.text();

    app.caches.articleContent.set(
        article.id,
        content,
    );

    return content;
}

function renderContentValue(
    content,
    explicitType,
) {
    if (content == null) {
        return "";
    }

    if (
        typeof content === "object" &&
        content.html
    ) {
        return sanitizeRenderedHtml(
            content.html,
        );
    }

    if (
        typeof content === "object" &&
        content.markdown
    ) {
        return renderMarkdown(
            String(
                content.markdown,
            ),
        );
    }

    if (typeof content !== "string") {
        return escapeHtml(
            String(content),
        );
    }

    const contentType =
        explicitType ||
        detectContentType(
            content,
        );

    if (contentType === "html") {
        return sanitizeRenderedHtml(
            content,
        );
    }

    if (
        contentType === "md" ||
        contentType === "markdown"
    ) {
        return renderMarkdown(
            content,
        );
    }

    return renderPlainText(
        content,
    );
}

function detectContentType(content) {
    const trimmed =
        content.trim();

    if (
        /<\/?[a-z][\s\S]*>/i.test(
            trimmed,
        )
    ) {
        return "html";
    }

    if (
        /^#{1,6}\s+/m.test(
            trimmed,
        ) ||
        /^\s*```/m.test(
            trimmed,
        ) ||
        /^\s*[-*+]\s+/m.test(
            trimmed,
        ) ||
        /^\s*\d+\.\s+/m.test(
            trimmed,
        )
    ) {
        return "markdown";
    }

    return "txt";
}

function renderPlainText(text) {
    return text
        .split(/\n{2,}/)
        .map(
            (paragraph) => {
                const normalized =
                    paragraph
                        .trim();

                if (!normalized) {
                    return "";
                }

                return `<p>${escapeHtml(
                    normalized,
                ).replace(
                    /\n/g,
                    "<br>",
                )}</p>`;
            },
        )
        .filter(Boolean)
        .join("");
}

function renderMarkdown(markdown) {
    const normalized =
        markdown
            .replace(
                /\r\n/g,
                "\n",
            )
            .replace(
                /\r/g,
                "\n",
            )
            .trim();

    if (!normalized) {
        return "";
    }

    const lines =
        normalized.split("\n");

    const output = [];
    let index = 0;
    let inCodeBlock = false;
    let codeLanguage = "";
    let codeLines = [];
    let paragraphLines = [];
    let listType = null;
    let listItems = [];
    let blockquoteLines = [];

    const flushParagraph = () => {
        if (
            paragraphLines.length === 0
        ) {
            return;
        }

        const text =
            paragraphLines
                .join("\n")
                .trim();

        if (text) {
            output.push(
                `<p>${renderInlineMarkdown(
                    text,
                ).replace(
                    /\n/g,
                    "<br>",
                )}</p>`,
            );
        }

        paragraphLines = [];
    };

    const flushList = () => {
        if (
            !listType ||
            listItems.length === 0
        ) {
            listType = null;
            listItems = [];
            return;
        }

        const tag =
            listType === "ordered"
                ? "ol"
                : "ul";

        const items =
            listItems
                .map(
                    (item) =>
                        `<li>${renderInlineMarkdown(
                            item,
                        )}</li>`,
                )
                .join("");

        output.push(
            `<${tag}>${items}</${tag}>`,
        );

        listType = null;
        listItems = [];
    };

    const flushBlockquote = () => {
        if (
            blockquoteLines.length === 0
        ) {
            return;
        }

        const content =
            blockquoteLines.join("\n");

        output.push(
            `<blockquote><p>${renderInlineMarkdown(
                content,
            ).replace(
                /\n/g,
                "<br>",
            )}</p></blockquote>`,
        );

        blockquoteLines = [];
    };

    while (index < lines.length) {
        const line =
            lines[index];

        const fencedStart =
            line.match(
                /^\s*```([\w-]*)\s*$/,
            );

        if (fencedStart) {
            flushParagraph();
            flushList();
            flushBlockquote();

            if (!inCodeBlock) {
                inCodeBlock = true;
                codeLanguage =
                    fencedStart[1] || "";
                codeLines = [];
            } else {
                const languageClass =
                    codeLanguage
                        ? ` class="language-${escapeHtml(
                              codeLanguage,
                          )}"`
                        : "";

                output.push(
                    `<pre><code${languageClass}>${escapeHtml(
                        codeLines.join(
                            "\n",
                        ),
                    )}</code></pre>`,
                );

                inCodeBlock = false;
                codeLanguage = "";
                codeLines = [];
            }

            index += 1;
            continue;
        }

        if (inCodeBlock) {
            codeLines.push(line);
            index += 1;
            continue;
        }

        if (!line.trim()) {
            flushParagraph();
            flushList();
            flushBlockquote();
            index += 1;
            continue;
        }

        const heading =
            line.match(
                /^\s*(#{1,6})\s+(.+?)\s*#*\s*$/,
            );

        if (heading) {
            flushParagraph();
            flushList();
            flushBlockquote();

            const level =
                heading[1].length;

            output.push(
                `<h${level}>${renderInlineMarkdown(
                    heading[2],
                )}</h${level}>`,
            );

            index += 1;
            continue;
        }

        if (
            /^\s*(---+|\*\*\*+|___+)\s*$/.test(
                line,
            )
        ) {
            flushParagraph();
            flushList();
            flushBlockquote();

            output.push("<hr>");

            index += 1;
            continue;
        }

        const blockquote =
            line.match(
                /^\s*>\s?(.*)$/,
            );

        if (blockquote) {
            flushParagraph();
            flushList();

            blockquoteLines.push(
                blockquote[1],
            );

            index += 1;
            continue;
        }

        if (
            blockquoteLines.length > 0
        ) {
            flushBlockquote();
        }

        const ordered =
            line.match(
                /^\s*\d+\.\s+(.+)$/,
            );

        const unordered =
            line.match(
                /^\s*[-*+]\s+(.+)$/,
            );

        if (ordered || unordered) {
            flushParagraph();

            const nextType =
                ordered
                    ? "ordered"
                    : "unordered";

            if (
                listType &&
                listType !== nextType
            ) {
                flushList();
            }

            listType =
                nextType;

            listItems.push(
                (
                    ordered ||
                    unordered
                )[1],
            );

            index += 1;
            continue;
        }

        if (listType) {
            flushList();
        }

        paragraphLines.push(line);

        index += 1;
    }

    if (inCodeBlock) {
        const languageClass =
            codeLanguage
                ? ` class="language-${escapeHtml(
                      codeLanguage,
                  )}"`
                : "";

        output.push(
            `<pre><code${languageClass}>${escapeHtml(
                codeLines.join("\n"),
            )}</code></pre>`,
        );
    }

    flushParagraph();
    flushList();
    flushBlockquote();

    return output.join("");
}

function renderInlineMarkdown(text) {
    let value =
        escapeHtml(text);

    const codeTokens = [];

    value = value.replace(
        /`([^`]+)`/g,
        (_, code) => {
            const token =
                `@@CODE_${codeTokens.length}@@`;

            codeTokens.push(
                `<code>${code}</code>`,
            );

            return token;
        },
    );

    value = value.replace(
        /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
        (_, alt, url, title) => {
            const safeUrl =
                sanitizeUrl(
                    decodeHtmlEntities(
                        url,
                    ),
                );

            if (!safeUrl) {
                return escapeHtml(
                    alt,
                );
            }

            const safeTitle =
                title
                    ? ` title="${escapeHtml(
                          title,
                      )}"`
                    : "";

            return `<img src="${escapeHtml(
                safeUrl,
            )}" alt="${escapeHtml(
                alt,
            )}"${safeTitle} loading="lazy" decoding="async">`;
        },
    );

    value = value.replace(
        /\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
        (_, label, url, title) => {
            const safeUrl =
                sanitizeUrl(
                    decodeHtmlEntities(
                        url,
                    ),
                );

            if (!safeUrl) {
                return label;
            }

            const isExternal =
                /^https?:\/\//i.test(
                    safeUrl,
                );

            const target =
                isExternal
                    ? ' target="_blank" rel="noopener noreferrer"'
                    : "";

            const safeTitle =
                title
                    ? ` title="${escapeHtml(
                          title,
                      )}"`
                    : "";

            return `<a href="${escapeHtml(
                safeUrl,
            )}"${target}${safeTitle}>${label}</a>`;
        },
    );

    value = value.replace(
        /\*\*([^*]+)\*\*/g,
        "<strong>$1</strong>",
    );

    value = value.replace(
        /__([^_]+)__/g,
        "<strong>$1</strong>",
    );

    value = value.replace(
        /(^|[^\*])\*([^*]+)\*(?!\*)/g,
        "$1<em>$2</em>",
    );

    value = value.replace(
        /(^|[^_])_([^_]+)_(?!_)/g,
        "$1<em>$2</em>",
    );

    value = value.replace(
        /~~([^~]+)~~/g,
        "<del>$1</del>",
    );

    codeTokens.forEach(
        (token, index) => {
            value = value.replace(
                `@@CODE_${index}@@`,
                token,
            );
        },
    );

    return value;
}

function sanitizeRenderedHtml(html) {
    const template =
        document.createElement(
            "template",
        );

    template.innerHTML =
        String(html);

    const forbiddenTags =
        new Set([
            "script",
            "iframe",
            "object",
            "embed",
            "form",
            "style",
            "link",
            "meta",
            "base",
        ]);

    template.content
        .querySelectorAll("*")
        .forEach((element) => {
            if (
                forbiddenTags.has(
                    element.tagName.toLowerCase(),
                )
            ) {
                element.remove();
                return;
            }

            [...element.attributes].forEach(
                (attribute) => {
                    const name =
                        attribute.name.toLowerCase();

                    const value =
                        attribute.value;

                    if (
                        name.startsWith(
                            "on",
                        )
                    ) {
                        element.removeAttribute(
                            attribute.name,
                        );
                        return;
                    }

                    if (
                        (
                            name === "href" ||
                            name === "src"
                        ) &&
                        !sanitizeUrl(value)
                    ) {
                        element.removeAttribute(
                            attribute.name,
                        );
                    }
                },
            );

            if (
                element.tagName.toLowerCase() ===
                    "a" &&
                /^https?:\/\//i.test(
                    element.getAttribute(
                        "href",
                    ) || "",
                )
            ) {
                element.setAttribute(
                    "target",
                    "_blank",
                );

                element.setAttribute(
                    "rel",
                    "noopener noreferrer",
                );
            }
        });

    return template.innerHTML;
}

function createErrorContent(
    message,
    error,
) {
    const detail =
        error?.message
            ? ` ${error.message}`
            : "";

    return `
        <p>${escapeHtml(
            message,
        )}</p>
        <p>${escapeHtml(
            detail.trim(),
        )}</p>
    `;
}

async function shareCurrentContent() {
    const content =
        app.state.currentContent;

    if (!content) {
        return;
    }

    const shareData = {
        title:
            content.title,
        text:
            content.title,
        url:
            window.location.href,
    };

    if (
        typeof navigator.share ===
            "function"
    ) {
        try {
            await navigator.share(
                shareData,
            );

            return;
        } catch (error) {
            if (
                error?.name ===
                "AbortError"
            ) {
                return;
            }
        }
    }

    try {
        await navigator.clipboard.writeText(
            window.location.href,
        );

        showToast(
            "success",
            "Liên kết đã được sao chép",
            "Đường dẫn nội dung hiện tại đã được lưu vào clipboard.",
        );
    } catch {
        showToast(
            "error",
            "Không thể chia sẻ",
            "Trình duyệt không cho phép truy cập clipboard.",
        );
    }
}

function openDrawer(drawerId) {
    const drawer =
        document.getElementById(
            drawerId,
        );

    if (!drawer) {
        return;
    }

    closeAllDialogs();

    app.state.previousFocus =
        document.activeElement;

    drawer.classList.add(
        "is-open",
    );

    drawer.setAttribute(
        "aria-hidden",
        "false",
    );

    drawer.removeAttribute(
        "inert",
    );

    app.body.classList.add(
        "is-scroll-locked",
    );

    const menuButton =
        document.querySelector(
            `[data-open-drawer="${CSS.escape(
                drawerId,
            )}"]`,
        );

    menuButton?.setAttribute(
        "aria-expanded",
        "true",
    );

    requestAnimationFrame(() => {
        const focusTarget =
            drawer.querySelector(
                ".navigation-drawer__panel button, .navigation-drawer__panel a",
            );

        focusTarget?.focus();
    });
}

function closeDrawer(drawerId) {
    const drawer =
        document.getElementById(
            drawerId,
        );

    if (!drawer) {
        return;
    }

    drawer.classList.remove(
        "is-open",
    );

    drawer.setAttribute(
        "aria-hidden",
        "true",
    );

    drawer.setAttribute(
        "inert",
        "",
    );

    const menuButton =
        document.querySelector(
            `[data-open-drawer="${CSS.escape(
                drawerId,
            )}"]`,
        );

    menuButton?.setAttribute(
        "aria-expanded",
        "false",
    );

    if (
        !document.querySelector(
            ".navigation-drawer.is-open",
        ) &&
        !document.querySelector(
            "dialog[open][data-dialog]",
        )
    ) {
        app.body.classList.remove(
            "is-scroll-locked",
        );
    }

    restorePreviousFocus();
}

function openDialog(dialogId) {
    const dialog =
        document.getElementById(
            dialogId,
        );

    if (
        !dialog ||
        typeof dialog.showModal !==
            "function"
    ) {
        return;
    }

    closeAllDrawers();

    app.state.previousFocus =
        document.activeElement;

    if (dialog.open) {
        return;
    }

    dialog.classList.remove(
        "is-closing",
    );

    dialog.showModal();

    app.body.classList.add(
        "is-scroll-locked",
    );

    const autofocus =
        dialog.querySelector(
            "[autofocus]",
        );

    const fallback =
        dialog.querySelector(
            "input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]",
        );

    requestAnimationFrame(() => {
        (
            autofocus ||
            fallback
        )?.focus();

        if (
            dialogId ===
            "search-dialog"
        ) {
            app.ui.searchInput?.focus();
        }
    });
}

function closeDialog(dialogId) {
    const dialog =
        document.getElementById(
            dialogId,
        );

    if (
        !dialog ||
        !dialog.open
    ) {
        return;
    }

    if (
        app.settings.motion &&
        !window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches
    ) {
        dialog.classList.add(
            "is-closing",
        );

        window.setTimeout(
            () => {
                if (dialog.open) {
                    dialog.close();
                }
            },
            180,
        );

        return;
    }

    dialog.close();
}

function closeAllDialogs() {
    document
        .querySelectorAll(
            "dialog[open][data-dialog]",
        )
        .forEach((dialog) => {
            dialog.classList.remove(
                "is-closing",
            );
            dialog.close();
        });
}

function closeAllDrawers() {
    document
        .querySelectorAll(
            ".navigation-drawer.is-open",
        )
        .forEach((drawer) => {
            closeDrawer(
                drawer.id,
            );
        });
}

function closeAllTransientLayers() {
    closeAllDrawers();

    document
        .querySelectorAll(
            "dialog[open][data-dialog]",
        )
        .forEach((dialog) => {
            closeDialog(
                dialog.id,
            );
        });
}

document.addEventListener(
    "close",
    (event) => {
        const dialog =
            event.target.closest(
                "dialog[data-dialog]",
            );

        if (!dialog) {
            return;
        }

        dialog.classList.remove(
            "is-closing",
        );

        if (
            !document.querySelector(
                "dialog[open][data-dialog]",
            ) &&
            !document.querySelector(
                ".navigation-drawer.is-open",
            )
        ) {
            app.body.classList.remove(
                "is-scroll-locked",
            );
        }

        restorePreviousFocus();
    },
);

document.addEventListener(
    "cancel",
    (event) => {
        const dialog =
            event.target.closest(
                "dialog[data-dialog]",
            );

        if (!dialog) {
            return;
        }

        event.preventDefault();
        closeDialog(
            dialog.id,
        );
    },
);

document.addEventListener(
    "change",
    (event) => {
        const target =
            event.target;

        if (
            target instanceof HTMLInputElement &&
            target.matches(
                APP_CONFIG.selectors.themeOption,
            )
        ) {
            updateSettingsFromControl(
                target,
            );
            return;
        }

        if (
            target instanceof HTMLInputElement &&
            target.matches(
                APP_CONFIG.selectors.panelThemeOption,
            )
        ) {
            updateSettingsFromControl(
                target,
            );
            return;
        }

        if (
            target instanceof HTMLInputElement &&
            target.matches(
                APP_CONFIG.selectors.backgroundOption,
            )
        ) {
            updateSettingsFromControl(
                target,
            );
            return;
        }

        if (
            target instanceof HTMLSelectElement &&
            target.matches(
                APP_CONFIG.selectors.articleSort,
            )
        ) {
            setArticleSort(
                target.value,
            );
        }
    },
);

function restorePreviousFocus() {
    const previous =
        app.state.previousFocus;

    if (
        previous &&
        previous instanceof HTMLElement &&
        document.contains(previous)
    ) {
        window.setTimeout(
            () => {
                previous.focus();
            },
            0,
        );
    }

    app.state.previousFocus =
        null;
}

function trapFocusInContainer(
    event,
    container,
) {
    if (!container) {
        return;
    }

    const focusable =
        getFocusableElements(
            container,
        );

    if (focusable.length === 0) {
        return;
    }

    const first =
        focusable[0];

    const last =
        focusable[
            focusable.length - 1
        ];

    if (
        event.shiftKey &&
        document.activeElement === first
    ) {
        event.preventDefault();
        last.focus();
    } else if (
        !event.shiftKey &&
        document.activeElement === last
    ) {
        event.preventDefault();
        first.focus();
    }
}

function getFocusableElements(
    container,
) {
    return [
        ...container.querySelectorAll(
            [
                "a[href]",
                "button:not([disabled])",
                "input:not([disabled])",
                "select:not([disabled])",
                "textarea:not([disabled])",
                "[tabindex]:not([tabindex='-1'])",
            ].join(","),
        ),
    ].filter(
        (element) =>
            !element.hasAttribute(
                "hidden",
            ) &&
            element.getAttribute(
                "aria-hidden",
            ) !== "true",
    );
}

function showToast(
    type,
    title,
    message,
) {
    if (!app.ui.toastRegion) {
        return;
    }

    const template =
        document.querySelector(
            APP_CONFIG.selectors.toastTemplate,
        );

    if (!template) {
        return;
    }

    const fragment =
        template.content.cloneNode(true);

    const toast =
        fragment.querySelector(
            "[data-toast]",
        );

    const icon =
        fragment.querySelector(
            "[data-toast-icon]",
        );

    const toastTitle =
        fragment.querySelector(
            "[data-toast-title]",
        );

    const toastMessage =
        fragment.querySelector(
            "[data-toast-message]",
        );

    toast.dataset.type =
        type;

    icon.innerHTML =
        createIconSvg(
            type === "success"
                ? "success"
                : type === "warning"
                  ? "warning"
                  : type === "error"
                    ? "error"
                    : "info",
        );

    toastTitle.textContent =
        title;

    toastMessage.textContent =
        message;

    const progress =
        fragment.querySelector(
            "[data-toast-progress]",
        );

    progress.style.setProperty(
        "--toast-duration",
        `${APP_CONFIG.toastDuration}ms`,
    );

    app.ui.toastRegion.append(
        fragment,
    );

    const insertedToast =
        app.ui.toastRegion.lastElementChild;

    const timeoutId =
        window.setTimeout(
            () => {
                dismissToast(
                    insertedToast,
                );
            },
            APP_CONFIG.toastDuration,
        );

    insertedToast.dataset.timeoutId =
        String(timeoutId);
}

function dismissToast(toast) {
    if (
        !toast ||
        toast.classList.contains(
            "is-leaving",
        )
    ) {
        return;
    }

    const timeoutId =
        Number(
            toast.dataset.timeoutId,
        );

    if (
        Number.isFinite(timeoutId)
    ) {
        window.clearTimeout(
            timeoutId,
        );
    }

    toast.classList.add(
        "is-leaving",
    );

    window.setTimeout(
        () => {
            toast.remove();
        },
        180,
    );
}

async function loadJsonFromElement(
    attributeName,
) {
    if (!app.root) {
        throw new Error(
            "Không tìm thấy root application.",
        );
    }

    const source =
        app.root.dataset[
            kebabToCamel(attributeName)
        ];

    if (!source) {
        throw new Error(
            `Thiếu nguồn dữ liệu: ${attributeName}.`,
        );
    }

    const url =
        resolveResourceUrl(
            source,
        );

    const response =
        await fetch(
            url,
            {
                method: "GET",
                cache: "default",
                credentials: "same-origin",
                headers: {
                    Accept:
                        "application/json",
                },
            },
        );

    if (!response.ok) {
        throw new Error(
            `Không thể tải ${url}. HTTP ${response.status}.`,
        );
    }

    return response.json();
}

function normalizeSiteData(data) {
    if (
        !data ||
        typeof data !== "object"
    ) {
        return null;
    }

    const site =
        data.site &&
        typeof data.site === "object"
            ? data.site
            : data;

    return {
        name:
            normalizePlainText(
                site.name,
            ),
        mark:
            normalizePlainText(
                site.mark,
            ),
        tagline:
            normalizePlainText(
                site.tagline,
            ),
        hero: {
            eyebrow:
                normalizePlainText(
                    site.hero?.eyebrow,
                ),
            title:
                normalizePlainText(
                    site.hero?.title,
                ),
            description:
                normalizePlainText(
                    site.hero?.description,
                ),
            statistics:
                Array.isArray(
                    site.hero?.statistics,
                )
                    ? site.hero.statistics
                    : [],
        },
        profile: {
            name:
                normalizePlainText(
                    site.profile?.name,
                ),
            role:
                normalizePlainText(
                    site.profile?.role,
                ),
            image:
                normalizePlainText(
                    site.profile?.image,
                ),
        },
        about: {
            summary:
                normalizePlainText(
                    site.about?.summary,
                ),
            content:
                site.about?.content ||
                "",
        },
        skills:
            Array.isArray(
                site.skills,
            )
                ? site.skills
                : [],
        technologies:
            Array.isArray(
                site.technologies,
            )
                ? site.technologies
                : [],
        socialLinks:
            Array.isArray(
                site.socialLinks,
            )
                ? site.socialLinks
                : Array.isArray(
                        site.socials,
                    )
                  ? site.socials
                  : [],
        contact: {
            title:
                normalizePlainText(
                    site.contact?.title,
                ),
            description:
                normalizePlainText(
                    site.contact?.description,
                ),
            primaryAction:
                site.contact?.primaryAction ||
                null,
            secondaryAction:
                site.contact?.secondaryAction ||
                null,
            links:
                Array.isArray(
                    site.contact?.links,
                )
                    ? site.contact.links
                    : [],
        },
        footer: {
            description:
                normalizePlainText(
                    site.footer?.description,
                ),
        },
    };
}

function normalizeNavigationData(data) {
    if (
        Array.isArray(data)
    ) {
        return data;
    }

    if (
        data &&
        Array.isArray(
            data.items,
        )
    ) {
        return data;
    }

    return null;
}

function normalizeProjectsData(data) {
    const items =
        Array.isArray(data)
            ? data
            : Array.isArray(
                    data?.projects,
                )
              ? data.projects
              : [];

    return items
        .map(
            normalizeProject,
        )
        .filter(Boolean);
}

function normalizeArticlesData(data) {
    const items =
        Array.isArray(data)
            ? data
            : Array.isArray(
                    data?.articles,
                )
              ? data.articles
              : [];

    return items
        .map(
            normalizeArticle,
        )
        .filter(Boolean);
}

function normalizeBackgroundsData(data) {
    const items =
        Array.isArray(data)
            ? data
            : Array.isArray(
                    data?.backgrounds,
                )
              ? data.backgrounds
              : [];

    return items
        .map(
            normalizeBackgroundItem,
        )
        .filter(Boolean);
}

function normalizeProject(item) {
    if (
        !item ||
        typeof item !== "object"
    ) {
        return null;
    }

    const title =
        normalizePlainText(
            item.title,
        );

    if (!title) {
        return null;
    }

    return {
        id:
            normalizeId(
                item.id,
                title,
            ),
        title,
        description:
            normalizePlainText(
                item.description,
            ),
        category:
            normalizePlainText(
                item.category,
            ),
        date:
            item.date || "",
        status:
            normalizePlainText(
                item.status,
            ),
        image:
            normalizePlainText(
                item.image,
            ),
        imageAlt:
            normalizePlainText(
                item.imageAlt,
            ),
        technologies:
            normalizeStringArray(
                item.technologies,
            ),
        links:
            Array.isArray(
                item.links,
            )
                ? item.links
                : [],
        content:
            item.content ||
            "",
        readingTime:
            item.readingTime,
    };
}

function normalizeArticle(item) {
    if (
        !item ||
        typeof item !== "object"
    ) {
        return null;
    }

    const title =
        normalizePlainText(
            item.title,
        );

    if (!title) {
        return null;
    }

    const contentSource =
        normalizePlainText(
            item.contentSource ||
                item.source ||
                item.file,
        );

    const contentText =
        typeof item.content ===
            "string" &&
        !contentSource
            ? item.content
            : "";

    return {
        id:
            normalizeId(
                item.id,
                title,
            ),
        title,
        description:
            normalizePlainText(
                item.description,
            ),
        category:
            normalizePlainText(
                item.category,
            ),
        date:
            item.date || "",
        image:
            normalizePlainText(
                item.image,
            ),
        imageAlt:
            normalizePlainText(
                item.imageAlt,
            ),
        tags:
            normalizeStringArray(
                item.tags,
            ),
        contentSource,
        contentType:
            normalizePlainText(
                item.contentType,
            ),
        contentText,
        readingTime:
            item.readingTime,
    };
}

function normalizeBackgroundItem(
    item,
) {
    if (
        !item ||
        typeof item !== "object"
    ) {
        return null;
    }

    const id =
        normalizePlainText(
            item.id,
        );

    const label =
        normalizePlainText(
            item.label ||
                item.name,
        );

    if (!id || !label) {
        return null;
    }

    return {
        id,
        label,
        previewClass:
            normalizePlainText(
                item.previewClass,
            ),
    };
}

function normalizeNavigationItem(item) {
    if (
        !item ||
        typeof item !== "object"
    ) {
        return null;
    }

    const route =
        normalizePlainText(
            item.route ||
                item.id,
        );

    const label =
        normalizePlainText(
            item.label ||
                item.title,
        );

    if (!route || !label) {
        return null;
    }

    return {
        route,
        label,
    };
}

function normalizeStatistic(item) {
    if (
        !item ||
        typeof item !== "object"
    ) {
        return null;
    }

    const value =
        normalizePlainText(
            item.value,
        );

    const label =
        normalizePlainText(
            item.label,
        );

    if (!value || !label) {
        return null;
    }

    return {
        value,
        label,
    };
}

function normalizeSkill(item) {
    if (
        !item ||
        typeof item !== "object"
    ) {
        return null;
    }

    const name =
        normalizePlainText(
            item.name,
        );

    const levelNumber =
        Number(
            item.level ??
                item.value,
        );

    if (
        !name ||
        !Number.isFinite(
            levelNumber,
        )
    ) {
        return null;
    }

    return {
        name,
        level:
            Math.min(
                100,
                Math.max(
                    0,
                    Math.round(
                        levelNumber,
                    ),
                ),
            ),
    };
}

function normalizeContactAction(
    item,
) {
    if (
        !item ||
        typeof item !== "object"
    ) {
        return null;
    }

    const label =
        normalizePlainText(
            item.label,
        );

    const url =
        sanitizeUrl(
            item.url,
        );

    if (!label || !url) {
        return null;
    }

    return {
        label,
        url,
        external:
            /^https?:\/\//i.test(
                url,
            ),
    };
}

function normalizeContactLink(
    item,
) {
    if (
        !item ||
        typeof item !== "object"
    ) {
        return null;
    }

    const label =
        normalizePlainText(
            item.label,
        );

    const value =
        normalizePlainText(
            item.value,
        );

    const url =
        sanitizeUrl(
            item.url,
        );

    if (
        !label ||
        !value ||
        !url
    ) {
        return null;
    }

    return {
        label,
        value,
        url,
        icon:
            normalizePlainText(
                item.icon,
            ),
        external:
            /^https?:\/\//i.test(
                url,
            ),
    };
}

function normalizeSocialLink(item) {
    if (
        !item ||
        typeof item !== "object"
    ) {
        return null;
    }

    const label =
        normalizePlainText(
            item.label ||
                item.name,
        );

    const url =
        sanitizeUrl(
            item.url,
        );

    if (!label || !url) {
        return null;
    }

    return {
        label,
        url,
        icon:
            normalizePlainText(
                item.icon,
            ),
    };
}

function normalizeExternalLink(
    item,
) {
    if (
        !item ||
        typeof item !== "object"
    ) {
        return null;
    }

    const url =
        sanitizeUrl(
            item.url,
        );

    const label =
        normalizePlainText(
            item.label ||
                item.title ||
                item.type ||
                "Mở liên kết",
        );

    if (!url || !label) {
        return null;
    }

    return {
        url,
        label,
        icon:
            normalizePlainText(
                item.icon,
            ),
        external:
            /^https?:\/\//i.test(
                url,
            ),
    };
}

function normalizeStringArray(
    value,
) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map(
            (item) =>
                normalizePlainText(
                    typeof item ===
                        "string"
                        ? item
                        : item?.name,
                ),
        )
        .filter(Boolean);
}

function normalizeId(
    value,
    fallback,
) {
    const source =
        normalizePlainText(
            value,
        ) ||
        fallback;

    return source
        .toLocaleLowerCase(
            "vi",
        )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            "",
        )
        .replace(
            /đ/g,
            "d",
        )
        .replace(
            /[^a-z0-9]+/g,
            "-",
        )
        .replace(
            /^-+|-+$/g,
            "",
        );
}

function normalizePlainText(
    value,
) {
    if (
        value == null
    ) {
        return "";
    }

    return String(
        value,
    ).trim();
}

function normalizeComparable(
    value,
) {
    return normalizePlainText(
        value,
    )
        .toLocaleLowerCase(
            "vi",
        )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            "",
        );
}

function findProjectById(id) {
    return app.data.projects.find(
        (project) =>
            project.id === id,
    );
}

function findArticleById(id) {
    return app.data.articles.find(
        (article) =>
            article.id === id,
    );
}

function setTextForSelector(
    selector,
    value,
) {
    if (
        value == null ||
        value === ""
    ) {
        return;
    }

    document
        .querySelectorAll(selector)
        .forEach((element) => {
            element.textContent =
                value;
        });
}

function setDateElement(
    element,
    dateValue,
) {
    if (!element) {
        return;
    }

    const date =
        parseDate(
            dateValue,
        );

    if (!date) {
        element.textContent =
            "";

        element.removeAttribute(
            "datetime",
        );

        return;
    }

    element.dateTime =
        date.toISOString();

    element.textContent =
        new Intl.DateTimeFormat(
            "vi-VN",
            {
                year: "numeric",
                month: "long",
                day: "numeric",
            },
        ).format(date);
}

function parseDate(value) {
    if (
        value instanceof Date &&
        !Number.isNaN(
            value.getTime(),
        )
    ) {
        return value;
    }

    if (
        typeof value !== "string" &&
        typeof value !== "number"
    ) {
        return null;
    }

    const date =
        new Date(value);

    return Number.isNaN(
        date.getTime(),
    )
        ? null
        : date;
}

function getTimestamp(value) {
    const date =
        parseDate(value);

    return date
        ? date.getTime()
        : 0;
}

function formatReadingTime(
    value,
) {
    const explicit =
        Number(value);

    if (
        Number.isFinite(
            explicit,
        ) &&
        explicit > 0
    ) {
        return `${Math.round(
            explicit,
        )} phút đọc`;
    }

    return "";
}

function estimateReadingTime(
    text,
) {
    const plain =
        String(
            text || "",
        )
            .replace(
                /[`*_#>\[\]()`]/g,
                " ",
            )
            .replace(
                /\s+/g,
                " ",
            )
            .trim();

    if (!plain) {
        return 0;
    }

    const wordCount =
        plain.split(
            /\s+/,
        ).length;

    return Math.max(
        1,
        Math.ceil(
            wordCount /
                APP_CONFIG.articleWordsPerMinute,
        ),
    );
}

function sanitizeUrl(
    rawUrl,
) {
    const value =
        normalizePlainText(
            rawUrl,
        );

    if (!value) {
        return "";
    }

    try {
        const url =
            new URL(
                value,
                document.baseURI,
            );

        const allowedProtocols =
            new Set([
                "http:",
                "https:",
                "mailto:",
                "tel:",
            ]);

        if (
            !allowedProtocols.has(
                url.protocol,
            )
        ) {
            return "";
        }

        return url.href;
    } catch {
        return "";
    }
}

function resolveResourceUrl(
    source,
) {
    return new URL(
        String(source),
        document.baseURI,
    ).href;
}

function getInitial(
    name,
) {
    const normalized =
        normalizePlainText(
            name,
        );

    if (!normalized) {
        return "";
    }

    return normalized
        .split(/\s+/)
        .slice(0, 2)
        .map(
            (part) =>
                part.charAt(0),
        )
        .join("")
        .toUpperCase();
}

function escapeHtml(
    value,
) {
    return String(
        value ?? "",
    ).replace(
        /[&<>"']/g,
        (character) => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            };

            return entities[
                character
            ];
        },
    );
}

function decodeHtmlEntities(
    value,
) {
    const textarea =
        document.createElement(
            "textarea",
        );

    textarea.innerHTML =
        value;

    return textarea.value;
}

function isTypingContext(
    target,
) {
    if (
        !(target instanceof Element)
    ) {
        return false;
    }

    return (
        target.matches(
            "input, textarea, select",
        ) ||
        target.isContentEditable
    );
}

function debounce(
    callback,
    delay,
) {
    let timeoutId = 0;

    return (...args) => {
        window.clearTimeout(
            timeoutId,
        );

        timeoutId =
            window.setTimeout(
                () => {
                    callback(
                        ...args,
                    );
                },
                delay,
            );
    };
}

function kebabToCamel(
    value,
) {
    return value.replace(
        /-([a-z])/g,
        (_, letter) =>
            letter.toUpperCase(),
    );
}

window.PortfolioApp = Object.freeze({
    getData() {
        return {
            site:
                app.data.site,
            navigation:
                app.data.navigation,
            projects: [
                ...app.data.projects,
            ],
            articles: [
                ...app.data.articles,
            ],
            backgrounds: [
                ...app.data.backgrounds,
            ],
        };
    },

    getSettings() {
        return {
            ...app.settings,
        };
    },

    openSearch() {
        openDialog(
            "search-dialog",
        );
    },

    openSettings() {
        openDialog(
            "settings-dialog",
        );
    },

    openMenu() {
        openDrawer(
            "navigation-drawer",
        );
    },

    scrollTo(route) {
        if (!route) {
            return;
        }

        scrollToHash(
            `#${route}`,
            true,
        );
    },
});
