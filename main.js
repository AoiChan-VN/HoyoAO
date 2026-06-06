import { App } from "./src/app.js";

const app = new App();

window.addEventListener("DOMContentLoaded", () => {
    app.bootstrap();
}); 
