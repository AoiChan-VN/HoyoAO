export class AppShell {

    render() {

        const root =
            document.createElement(
                "div"
            );

        root.id = "app-shell";

        root.innerHTML = `

            <header>

                Portfolio

            </header>

            <main id="router-view">

            </main>

        `;

        return root;

    }

} 
