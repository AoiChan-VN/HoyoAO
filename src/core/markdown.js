// Vanilla JS Markdown Parser - No dependencies
// Supports: headings, bold, italic, code, inline code, links, lists, blockquotes, code blocks

export class MarkdownParser {
  constructor() {
    this.rules = this.createRules();
  }

  createRules() {
    return {
      codeBlock: /```([\s\S]*?)```/g,
      heading: /^(#{1,6})\s+(.*)$/gm,
      bold: /\*\*(.*?)\*\*/g,
      italic: /\*(.*?)\*/g,
      inlineCode: /`([^`]+)`/g,
      link: /\[([^\]]+)\]\(([^)]+)\)/g,
      blockquote: /^>\s+(.*)$/gm,
      ul: /^-\s+(.*)$/gm,
      ol: /^\d+\.\s+(.*)$/gm
    };
  }

  parse(md) {
    if (!md || typeof md !== "string") return "";

    let html = md;

    // 1. Code blocks (protect first)
    html = html.replace(this.rules.codeBlock, (_, code) => {
      return `<pre class="code-block"><code>${this.escapeHtml(code)}</code></pre>`;
    });

    // 2. Headings
    html = html.replace(this.rules.heading, (_, level, text) => {
      const tag = "h" + level.length;
      return `<${tag}>${this.inline(text)}</${tag}>`;
    });

    // 3. Blockquote
    html = html.replace(this.rules.blockquote, (_, text) => {
      return `<blockquote>${this.inline(text)}</blockquote>`;
    });

    // 4. Lists (basic grouping)
    html = this.parseLists(html);

    // 5. Inline formatting
    html = this.inline(html);

    // 6. Paragraph wrap
    html = this.wrapParagraphs(html);

    return html.trim();
  }

  parseLists(text) {
    const lines = text.split("\n");
    let result = [];
    let buffer = [];
    let mode = null;

    const flush = () => {
      if (buffer.length === 0) return;

      if (mode === "ul") {
        result.push(`<ul>${buffer.map(i => `<li>${this.inline(i)}</li>`).join("")}</ul>`);
      } else if (mode === "ol") {
        result.push(`<ol>${buffer.map(i => `<li>${this.inline(i)}</li>`).join("")}</ol>`);
      }

      buffer = [];
      mode = null;
    };

    for (let line of lines) {
      let ul = line.match(this.rules.ul);
      let ol = line.match(this.rules.ol);

      if (ul) {
        if (mode && mode !== "ul") flush();
        mode = "ul";
        buffer.push(ul[0].replace("- ", ""));
      } else if (ol) {
        if (mode && mode !== "ol") flush();
        mode = "ol";
        buffer.push(ol[0].replace(/^\d+\.\s+/, ""));
      } else {
        flush();
        result.push(line);
      }
    }

    flush();
    return result.join("\n");
  }

  inline(text) {
    if (!text) return "";

    return text
      .replace(this.rules.bold, "<strong>$1</strong>")
      .replace(this.rules.italic, "<em>$1</em>")
      .replace(this.rules.inlineCode, "<code>$1</code>")
      .replace(this.rules.link, "<a href='$2' target='_blank'>$1</a>");
  }

  wrapParagraphs(text) {
    return text
      .split("\n\n")
      .map(p => {
        if (p.startsWith("<")) return p;
        if (p.trim() === "") return "";
        return `<p>${p.trim()}</p>`;
      })
      .join("\n");
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
} 
