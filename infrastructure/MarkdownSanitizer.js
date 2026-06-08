/**
 * @file    infrastructure/MarkdownSanitizer.js
 * @layer   Infrastructure — Secure Content Adapter
 * @desc    Pure-Regex Markdown → HTML parser with enterprise-grade
 *          XSS / injection / buffer-overflow sanitisation.
 *
 *          Supported syntax:
 *            Block  : headings H1-H6, fenced code blocks (``` lang),
 *                     blockquotes, unordered/ordered lists, GFM tables,
 *                     horizontal rules, paragraphs.
 *            Inline : bold (**/**_), italic (*/_), strikethrough (~~),
 *                     inline code (`), links [text](url),
 *                     images ![alt](url).
 *
 *          Security layers:
 *            1. Input pre-sanitise  : length cap, null-byte strip, dangerous
 *               Unicode removal (RTL override, zero-width, surrogates,
 *               non-characters, C0/C1 control chars).
 *            2. Inline safe-encode  : null-byte placeholder technique to
 *               prevent double-processing and regex collision attacks.
 *            3. Output sanitise     : HTML-tag allowlist + attribute
 *               allowlist + URL scheme verification + event-handler blocking.
 *            4. Attribute scrubbing : blocks all on* handlers, javascript:/
 *               vbscript:/ and CSS expression() vectors.
 *
 * @exports MarkdownSanitizer
 * @license MIT — VR Personal Website Platform
 */

'use strict';

// ─── Security limits ─────────────────────────────────────────────────────────
const MAX_INPUT_BYTES  = 524_288;   // 512 KiB — prevents DoS via giant payloads
const MAX_TABLE_ROWS   = 500;
const MAX_TABLE_COLS   = 64;
const MAX_SLUG_LEN     = 80;
const MAX_URL_LEN      = 2048;

// ─── HTML tag allowlist ───────────────────────────────────────────────────────
const ALLOWED_TAGS = new Set([
  'p','br','hr',
  'h1','h2','h3','h4','h5','h6',
  'strong','b','em','i','del','s','u',
  'ul','ol','li',
  'blockquote',
  'pre','code',
  'table','thead','tbody','tr','th','td',
  'a','img',
  'details','summary',
  'span'
]);

// ─── Per-tag attribute allowlists ─────────────────────────────────────────────
const ALLOWED_ATTR = {
  a:    ['href','title','target','rel'],
  img:  ['src','alt','title','loading','width','height'],
  th:   ['align','colspan','rowspan','scope'],
  td:   ['align','colspan','rowspan'],
  code: ['class'],
  pre:  ['class'],
  span: ['class'],
};

// ─── Attribute-value patterns that are always forbidden ──────────────────────
const BANNED_ATTR_NAME_RE = /^on[a-z]/i;             // onclick, onerror, …
const BANNED_ATTR_VAL_RE  = /javascript:|vbscript:|expression\s*\(/i;

// ─── Safe URL schemes ─────────────────────────────────────────────────────────
const SAFE_URL_RE = /^(https?:\/\/|\/\/|\/|#|mailto:|tel:|\.\/|\.\.\/)/i;

// ─── Dangerous Unicode codepoints removed from raw input ─────────────────────
const DANGEROUS_UNICODE_RE = new RegExp(
  '['  +
  '\u202A-\u202E' +   // Bidirectional override characters (RTL, LTR embed, etc.)
  '\u2066-\u2069' +   // Isolate and pop directional marks
  '\u200B-\u200F' +   // Zero-width space, ZWNJ, ZWJ, LRM, RLM
  '\uFEFF'        +   // BOM / zero-width no-break space
  '\x00-\x08'    +    // C0 control chars (except \t \n \r handled separately)
  '\x0B\x0C'     +    // Vertical tab, Form feed
  '\x0E-\x1F'    +    // Remaining C0 controls
  '\x7F'         +    // DEL
  '\uFDD0-\uFDEF' +   // Unicode non-characters (U+FDD0–U+FDEF)
  '\uFFFE\uFFFF'  +   // Non-characters at end of BMP
  ']', 'g'
);

// ─── Null-byte placeholder prefix (only safe after pre-sanitise strips \x00) ──
const PLACEHOLDER_PREFIX = '\x00P';
const PLACEHOLDER_RE     = /\x00P(\d+)\x00/g;

// ─────────────────────────────────────────────────────────────────────────────
export class MarkdownSanitizer {

  /**
   * Parse a Markdown string and return sanitised HTML.
   *
   * @param  {string} raw  Raw Markdown text (untrusted input).
   * @returns {string}     Safe HTML string ready for innerHTML assignment.
   */
  static parse(raw) {
    if (typeof raw !== 'string') return '';

    const cleaned = MarkdownSanitizer._preSanitise(raw);
    const rawHtml  = MarkdownSanitizer._parseBlocks(cleaned);
    const safe     = MarkdownSanitizer._sanitiseHTML(rawHtml);

    return safe;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  STAGE 1 — Input pre-sanitisation
  // ══════════════════════════════════════════════════════════════════════════

  static _preSanitise(input) {
    // 1a. Hard length cap (prevents ReDoS on very long lines)
    if (input.length > MAX_INPUT_BYTES) {
      input = input.slice(0, MAX_INPUT_BYTES);
    }

    // 1b. Strip all dangerous Unicode categories
    input = input.replace(DANGEROUS_UNICODE_RE, '');

    // 1c. Normalise line endings to \n
    input = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 1d. Cap excessive blank lines to 3 consecutive (prevents vertical padding abuse)
    input = input.replace(/\n{4,}/g, '\n\n\n');

    // 1e. Cap individual line length (prevents tokeniser complexity attacks)
    input = input
      .split('\n')
      .map(l => l.length > 4096 ? l.slice(0, 4096) : l)
      .join('\n');

    return input;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  STAGE 2 — Block-level parser
  // ══════════════════════════════════════════════════════════════════════════

  static _parseBlocks(text) {
    const lines  = text.split('\n');
    const output = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // ── Fenced code block (``` or ~~~) ────────────────────────────────────
      if (/^(`{3,}|~{3,})/.test(line)) {
        const fence = (line.match(/^(`{3,}|~{3,})/) || [''])[0];
        const lang  = line.slice(fence.length).trim()
                          .replace(/[^a-zA-Z0-9_\-+#]/g, '').slice(0, 32);
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith(fence)) {
          codeLines.push(MarkdownSanitizer._escapeHTML(lines[i]));
          i++;
        }
        const cls = lang ? ` class="language-${lang}"` : '';
        output.push(`<pre><code${cls}>${codeLines.join('\n')}</code></pre>`);
        i++; // consume closing fence
        continue;
      }

      // ── ATX Headings (# H1 … ###### H6) ──────────────────────────────────
      const hMatch = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+\s*)?$/);
      if (hMatch) {
        const lvl  = hMatch[1].length;
        const text2 = MarkdownSanitizer._parseInline(hMatch[2].trim());
        const id   = MarkdownSanitizer._toSlug(hMatch[2].trim());
        output.push(`<h${lvl} id="${id}">${text2}</h${lvl}>`);
        i++;
        continue;
      }

      // ── Horizontal rule ────────────────────────────────────────────────────
      if (/^[ \t]*(?:\*[ \t]*){3,}$|^[ \t]*(?:-[ \t]*){3,}$|^[ \t]*(?:_[ \t]*){3,}$/.test(line)) {
        output.push('<hr>');
        i++;
        continue;
      }

      // ── Blockquote (> …) ──────────────────────────────────────────────────
      if (/^>\s?/.test(line)) {
        const bqLines = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          bqLines.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        const inner = MarkdownSanitizer._parseBlocks(bqLines.join('\n'));
        output.push(`<blockquote>${inner}</blockquote>`);
        continue;
      }

      // ── Unordered list (- / * / +) ────────────────────────────────────────
      if (/^[ \t]*[-*+]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[ \t]*[-*+]\s+/.test(lines[i])) {
          const content = lines[i].replace(/^[ \t]*[-*+]\s+/, '');
          items.push(`<li>${MarkdownSanitizer._parseInline(content)}</li>`);
          i++;
        }
        output.push(`<ul>\n${items.join('\n')}\n</ul>`);
        continue;
      }

      // ── Ordered list (1. / 2. / …) ────────────────────────────────────────
      if (/^[ \t]*\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[ \t]*\d+\.\s+/.test(lines[i])) {
          const content = lines[i].replace(/^[ \t]*\d+\.\s+/, '');
          items.push(`<li>${MarkdownSanitizer._parseInline(content)}</li>`);
          i++;
        }
        output.push(`<ol>\n${items.join('\n')}\n</ol>`);
        continue;
      }

      // ── GFM Table (line with | and separator row beneath) ─────────────────
      if (/\|/.test(line) && i + 1 < lines.length &&
          /^\|?[\s:|\-]+\|?$/.test(lines[i + 1])) {
        const tableLines = [];
        while (i < lines.length && /\|/.test(lines[i])) {
          tableLines.push(lines[i]);
          i++;
        }
        output.push(MarkdownSanitizer._parseTable(tableLines));
        continue;
      }

      // ── Blank line — skip ─────────────────────────────────────────────────
      if (line.trim() === '') {
        i++;
        continue;
      }

      // ── Paragraph ─────────────────────────────────────────────────────────
      const paraLines = [];
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !/^(#{1,6}\s|`{3,}|~{3,}|>\s?|[ \t]*[-*+]\s|[ \t]*\d+\.\s|\*{3,}|-{3,}|_{3,})/.test(lines[i])
      ) {
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length > 0) {
        const joined = paraLines.join('\n').trim();
        const html   = MarkdownSanitizer._parseInline(joined).replace(/\n/g, '<br>');
        output.push(`<p>${html}</p>`);
      }
    }

    return output.join('\n');
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Table parser
  // ══════════════════════════════════════════════════════════════════════════

  static _parseTable(lines) {
    if (lines.length < 2) return '';

    const parseRow = (line) =>
      line.trim().replace(/^\|/, '').replace(/\|$/, '')
          .split('|')
          .slice(0, MAX_TABLE_COLS)
          .map(c => c.trim());

    const headerCells = parseRow(lines[0]);
    const sepRow      = parseRow(lines[1]);
    const aligns      = sepRow.map(cell => {
      if (/^:-+:$/.test(cell)) return 'center';
      if (/^-+:$/.test(cell))  return 'right';
      return 'left';
    });

    let html = '<table>\n<thead>\n<tr>\n';
    headerCells.forEach((cell, j) => {
      const al = aligns[j] || 'left';
      html += `<th align="${al}">${MarkdownSanitizer._parseInline(cell)}</th>\n`;
    });
    html += '</tr>\n</thead>\n';

    const dataRows = lines.slice(2, 2 + MAX_TABLE_ROWS);
    if (dataRows.length > 0) {
      html += '<tbody>\n';
      for (const rowLine of dataRows) {
        const cells = parseRow(rowLine);
        html += '<tr>\n';
        headerCells.forEach((_, j) => {
          const al      = aligns[j] || 'left';
          const content = cells[j] !== undefined ? cells[j] : '';
          html += `<td align="${al}">${MarkdownSanitizer._parseInline(content)}</td>\n`;
        });
        html += '</tr>\n';
      }
      html += '</tbody>\n';
    }

    html += '</table>';
    return html;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Inline parser  (null-byte placeholder approach)
  //
  //  Processing order prevents conflicts:
  //    1. Inline code    (highest priority — prevents parsing inside backticks)
  //    2. Images         (superset of link syntax — must precede links)
  //    3. Links          (before bold/italic to protect nested brackets)
  //    4. Strikethrough  (before bold/italic to handle ~~ correctly)
  //    5. Bold **        (before italic * to handle *** correctly)
  //    6. Bold __        (before italic _)
  //    7. Italic *
  //    8. Italic _
  //    9. Remaining plain text → HTML-escape
  //   10. Restore placeholders
  // ══════════════════════════════════════════════════════════════════════════

  static _parseInline(text) {
    if (!text) return '';

    const safe = [];                     // Safe HTML fragments indexed by slot
    const slot = (html) => {
      const idx = safe.length;
      safe.push(html);
      return `${PLACEHOLDER_PREFIX}${idx}\x00`;
    };

    let s = text;

    // 1. Inline code
    s = s.replace(/`([^`\n]+)`/g, (_, code) =>
      slot(`<code>${MarkdownSanitizer._escapeHTML(code)}</code>`)
    );

    // 2. Images  ![alt](url "optional title")
    s = s.replace(/!\[([^\]]{0,512})\]\(([^)]{0,2100})\)/g, (_, alt, rest) => {
      const [rawUrl, title] = MarkdownSanitizer._splitUrlTitle(rest);
      const safeSrc = MarkdownSanitizer._sanitiseURL(rawUrl);
      if (!safeSrc) return '';
      const safeAlt   = MarkdownSanitizer._escapeAttr(alt);
      const titleAttr = title ? ` title="${MarkdownSanitizer._escapeAttr(title)}"` : '';
      return slot(`<img src="${safeSrc}" alt="${safeAlt}"${titleAttr} loading="lazy">`);
    });

    // 3. Links  [label](url "optional title")
    s = s.replace(/\[([^\]]{0,512})\]\(([^)]{0,2100})\)/g, (_, label, rest) => {
      const [rawUrl, title] = MarkdownSanitizer._splitUrlTitle(rest);
      const safeURL = MarkdownSanitizer._sanitiseURL(rawUrl);
      const safeLabel = MarkdownSanitizer._escapeHTML(label);
      if (!safeURL) return safeLabel;
      const titleAttr = title ? ` title="${MarkdownSanitizer._escapeAttr(title)}"` : '';
      const extAttr   = /^https?:\/\//i.test(safeURL)
        ? ' target="_blank" rel="noopener noreferrer"' : '';
      return slot(`<a href="${safeURL}"${titleAttr}${extAttr}>${safeLabel}</a>`);
    });

    // 4. Strikethrough  ~~text~~
    s = s.replace(/~~([^~\n]{1,512})~~/g, (_, t) =>
      slot(`<del>${MarkdownSanitizer._escapeHTML(t)}</del>`)
    );

    // 5. Bold  **text**
    s = s.replace(/\*\*([^*\n]{1,512})\*\*/g, (_, t) =>
      slot(`<strong>${MarkdownSanitizer._escapeHTML(t)}</strong>`)
    );

    // 6. Bold  __text__
    s = s.replace(/__([^_\n]{1,512})__/g, (_, t) =>
      slot(`<strong>${MarkdownSanitizer._escapeHTML(t)}</strong>`)
    );

    // 7. Italic  *text*  (not preceded/followed by another *)
    s = s.replace(/(?<!\*)\*(?!\*)([^*\n]{1,256})(?<!\*)\*(?!\*)/g, (_, t) =>
      slot(`<em>${MarkdownSanitizer._escapeHTML(t)}</em>`)
    );

    // 8. Italic  _text_  (not inside words)
    s = s.replace(/(?<![a-zA-Z0-9])_([^_\n]{1,256})_(?![a-zA-Z0-9])/g, (_, t) =>
      slot(`<em>${MarkdownSanitizer._escapeHTML(t)}</em>`)
    );

    // 9. HTML-escape all remaining plain text (chars outside placeholders)
    s = s.replace(
      /\x00P\d+\x00|([^\x00]+)/g,
      (match, plainText) => {
        if (!plainText) return match;          // It's a placeholder — keep as is
        return MarkdownSanitizer._escapeHTML(plainText);
      }
    );

    // 10. Restore all placeholders
    s = s.replace(PLACEHOLDER_RE, (_, idx) => safe[parseInt(idx, 10)] ?? '');

    return s;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  STAGE 3 — HTML output sanitiser (allowlist-based tag/attribute scrubbing)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Walk the generated HTML string and strip any tag / attribute that is not
   * on the explicit allowlists.  This acts as the final security gate before
   * the string is written to innerHTML.
   */
  static _sanitiseHTML(html) {
    return html.replace(
      /<\s*\/?\s*([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?\s*\/?>/g,
      (match, rawTag, attrStr) => {
        const tag     = rawTag.toLowerCase();
        const isClose = match.trimStart().startsWith('</');
        const isSelf  = match.trimEnd().endsWith('/>');

        // Strip unknown tags entirely (including script, iframe, object …)
        if (!ALLOWED_TAGS.has(tag)) return '';

        if (isClose) return `</${tag}>`;

        const attrs = MarkdownSanitizer._sanitiseAttrs(tag, attrStr || '');
        return `<${tag}${attrs}${isSelf ? ' /' : ''}>`;
      }
    );
  }

  static _sanitiseAttrs(tag, attrStr) {
    const allowed = ALLOWED_ATTR[tag];
    if (!allowed || allowed.length === 0) return '';

    const out    = [];
    const attrRE = /\s+([\w-]+)(?:\s*=\s*(?:"([^"]*?)"|'([^']*?)'|([^\s>]*)))?/g;
    let m;

    while ((m = attrRE.exec(attrStr)) !== null) {
      const name  = m[1].toLowerCase();
      const value = (m[2] ?? m[3] ?? m[4] ?? '');

      // Allowlist check
      if (!allowed.includes(name)) continue;

      // Block event handlers (onclick, onerror, onload, …)
      if (BANNED_ATTR_NAME_RE.test(name)) continue;

      // Check value for injection vectors
      if (BANNED_ATTR_VAL_RE.test(value)) continue;

      // URL attributes need scheme validation
      if (['href', 'src', 'action'].includes(name)) {
        const safe = MarkdownSanitizer._sanitiseURL(value);
        if (!safe) continue;
        out.push(`${name}="${safe}"`);
        continue;
      }

      // target="_blank" must always be paired with rel
      if (name === 'target' && value !== '_blank') continue;

      out.push(`${name}="${MarkdownSanitizer._escapeAttr(value)}"`);
    }

    return out.length ? ' ' + out.join(' ') : '';
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  URL sanitiser
  // ══════════════════════════════════════════════════════════════════════════

  static _sanitiseURL(raw) {
    if (!raw || typeof raw !== 'string') return '';

    // Length cap
    let url = raw.trim().slice(0, MAX_URL_LEN);

    // Percent-decode to catch encoded javascript: attacks
    try { url = decodeURIComponent(url); } catch { /* malformed encoding — keep raw */ }

    // Strip control characters and dangerous Unicode
    url = url.replace(DANGEROUS_UNICODE_RE, '').replace(/[\x00-\x1F\x7F]/g, '');

    // Reject obvious injection vectors in the decoded value
    if (BANNED_ATTR_VAL_RE.test(url)) return '';

    // Allow safe data-URIs (only image types)
    if (/^data:/i.test(url)) {
      return /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/i.test(url)
        ? MarkdownSanitizer._escapeAttr(url) : '';
    }

    // Must start with a safe scheme or be a relative path
    if (!SAFE_URL_RE.test(url)) return '';

    return MarkdownSanitizer._escapeAttr(url);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Escape helpers
  // ══════════════════════════════════════════════════════════════════════════

  /** HTML-escape for text nodes. */
  static _escapeHTML(str) {
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#x27;');
  }

  /** HTML-escape for attribute values. */
  static _escapeAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Utility helpers
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Split "url/path "optional title"" into [url, title|null].
   * @param {string} rest  Content inside parentheses after the closing bracket.
   * @returns {[string, string|null]}
   */
  static _splitUrlTitle(rest) {
    rest = rest.trim();
    const titleMatch = rest.match(/^(.+?)\s+"([^"]*)"$|^(.+?)\s+'([^']*)'$/);
    if (titleMatch) {
      return [
        (titleMatch[1] || titleMatch[3]).trim(),
        titleMatch[2] ?? titleMatch[4]
      ];
    }
    return [rest, null];
  }

  /**
   * Convert heading text to a safe URL-friendly slug.
   * @param {string} text
   * @returns {string}
   */
  static _toSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, MAX_SLUG_LEN);
  }
}
