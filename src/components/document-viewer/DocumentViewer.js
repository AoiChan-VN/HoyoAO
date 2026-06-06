const sheet =
new CSSStyleSheet();

const cssURL =
new URL(
"./DocumentViewer.css",
import.meta.url
);

const cssText =
await fetch(cssURL)
.then(r=>r.text());

sheet.replaceSync(cssText);

export default class DocumentViewer
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
<div class="viewer">

<div class="content">

<h2>
About
</h2>

<p>
Spatial Portfolio Platform
built using native HTML,
CSS and JavaScript.
</p>

</div>

</div>
`;
}
}

customElements.define(
"document-viewer",
DocumentViewer
); 
