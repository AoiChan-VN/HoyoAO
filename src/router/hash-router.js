import {
    routes,
    fallbackRoute
}
from "./route-table.js";

export class HashRouter {

    resolve() {

        const path =
            location.hash
                .slice(1)
            || "/";

        return (
            routes[path]
            || fallbackRoute
        );

    }

} 
