import AssetResolver
from "./AssetResolver.js";

export default class Skybox {

    constructor(world) {

        this.world = world;

        this.create();
    }

    create() {

        const faces = [

            "front",
            "back",
            "left",
            "right",
            "top",
            "bottom"
        ];

        const box =
            document.createElement(
                "div"
            );

        box.className =
            "skybox";

        for (
            const face
            of faces
        ) {

            const side =
                document.createElement(
                    "div"
                );

            side.className =
                `skybox-${face}`;

            side.style.backgroundImage =
                `url(${
                    AssetResolver.resolve(
                    `assets/skybox/${face}.webp`
                    )
                })`;

            box.appendChild(side);
        }

        this.world.appendChild(box);
    }
} 
