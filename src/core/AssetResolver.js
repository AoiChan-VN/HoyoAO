export default class AssetResolver {

    static base() {

        const path =
        window.location.pathname;

        if(
            path.includes("/Website/")
        ){
            return "/Website/";
        }

        return "./";
    }

    static resolve(asset){

        return new URL(
            asset,
            AssetResolver.base()
        ).toString();
    }
} 
