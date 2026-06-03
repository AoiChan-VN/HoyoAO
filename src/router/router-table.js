import {
    HomePage
}
from "../pages/home/page.js";

import {
    NotFoundPage
}
from "../pages/not-found/page.js";

export const routes = {

    "/": HomePage

};

export const fallbackRoute =
    NotFoundPage; 
