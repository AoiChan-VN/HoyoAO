export default class AssetResolver {

    static getBasePath() {

        const segments =
            window.location.pathname
            .split("/")
            .filter(Boolean);

        if (segments.length > 0) {
            return `/${segments[0]}/`;
        }

        return "/";
    }

    static resolve(assetPath) {

        const clean =
            assetPath.replace(/^\/+/, "");

        return `${this.getBasePath()}${clean}`;
    }
}
