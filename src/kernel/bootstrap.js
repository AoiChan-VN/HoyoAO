import {
    AppShell
}
from "../components/app-shell/app-shell.js";

import {
    HashRouter
}
from "../router/hash-router.js";

import {
    render
}
from "../renderer/dom-renderer.js";

export async function bootstrap() {

    const boot =
        document.getElementById(
            "boot-screen"
        );

    const app =
        document.getElementById(
            "app"
        );

    const shell =
        new AppShell();

    app.append(
        shell.render()
    );

    const router =
        new HashRouter();

    function updateRoute() {

        const Page =
            router.resolve();

        const page =
            new Page();

        render(
            document.getElementById(
                "router-view"
            ),
            page
        );

    }

    window.addEventListener(
        "hashchange",
        updateRoute
    );

    updateRoute();

    boot.remove();

    app.hidden = false;

} 
