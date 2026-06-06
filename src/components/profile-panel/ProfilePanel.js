const sheet =
new CSSStyleSheet();

const cssURL =
new URL(
"./ProfilePanel.css",
import.meta.url
);

const cssText =
await fetch(cssURL)
.then(r=>r.text());

sheet.replaceSync(cssText);

export default class ProfilePanel
extends HTMLElement{

constructor(){

super();

const root=
this.attachShadow({
mode:"open"
});

root.adoptedStyleSheets=[
sheet
];

root.innerHTML=`
<div class="panel">

<div class="avatar">
</div>

<div class="name">
Aoi Portfolio
</div>

<div class="role">
Spatial Web Developer
</div>

</div>
`;
}
}

customElements.define(
"profile-panel",
ProfilePanel
); 
