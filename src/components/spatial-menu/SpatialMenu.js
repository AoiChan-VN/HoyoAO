const sheet = new CSSStyleSheet();

const cssURL =
new URL(
"./SpatialMenu.css",
import.meta.url
);

const cssText =
await fetch(cssURL)
.then(r=>r.text());

sheet.replaceSync(cssText);

export default class SpatialMenu
extends HTMLElement{

constructor(){

super();

const root =
this.attachShadow({
mode:"open"
});

root.adoptedStyleSheets=[
sheet
];

root.innerHTML=`
<div class="spatial-menu">

<div class="title">
Navigation
</div>

<div class="nav">

<div class="item">
Profile
</div>

<div class="item">
Projects
</div>

<div class="item">
Documents
</div>

<div class="item">
Contact
</div>

</div>

</div>
`;
}
}

customElements.define(
"spatial-menu",
SpatialMenu
); 
