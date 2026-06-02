import { MarkdownParser } from "../core/markdown.js";

export class DataDriver {
  constructor(configPath = "./config/profile.json") {
    this.configPath = configPath;
    this.parser = new MarkdownParser();

    this.profile = null;
    this.tree = [];
    this.cache = new Map();
  }

  async init() {
    await this.loadProfile();
    await this.loadTree();
    this.bindLinks();
  }

  async loadProfile() {
    const res = await fetch(this.configPath);
    if (!res.ok) throw new Error("Cannot load profile.json");

    this.profile = await res.json();
  }

  async loadTree() {
    const res = await fetch("./src/data/default-tree.json");
    if (!res.ok) throw new Error("Cannot load default-tree.json");

    this.tree = await res.json();
  }

  getRouteFromPath() {
    const hash = window.location.hash || "#/";
    return hash.replace("#", "");
  }

  findNodeByRoute(route) {
    return this.tree.find(item => item.link === route);
  }

  async renderRoute(route, mountEl) {
    const node = this.findNodeByRoute(route);

    if (!node) {
      mountEl.innerHTML = "<h1>404 - Not Found</h1>";
      return;
    }

    const html = await this.loadMarkdown(node.file);

    mountEl.innerHTML = `
      <article class="page">
        <h1>${node.name}</h1>
        <div class="content">${html}</div>
      </article>
    `;
  }

  async loadMarkdown(filePath) {
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath);
    }

    const res = await fetch(filePath);
    if (!res.ok) return "<p>File not found</p>";

    const md = await res.text();
    const html = this.parser.parse(md);

    this.cache.set(filePath, html);
    return html;
  }

  bindLinks() {
    window.addEventListener("hashchange", () => {
      this.onRouteChange();
    });
  }

  async onRouteChange() {
    const route = this.getRouteFromPath();
    const mount = document.querySelector("#app");

    await this.renderRoute(route, mount);
  }

  async start() {
    await this.init();
    await this.onRouteChange();
  }
} 
