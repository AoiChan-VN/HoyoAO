export class VRMarkdownParser {
    constructor() {
        this.rules = [
            { regex: /&/g, replace: '&amp;' },
            { regex: /</g, replace: '&lt;' },
            { regex: />/g, replace: '&gt;' },
            { regex: /^######\s+(.*)$/gm, replace: '<h6>$1</h6>' },
            { regex: /^#####\s+(.*)$/gm, replace: '<h5>$1</h5>' },
            { regex: /^####\s+(.*)$/gm, replace: '<h4>$1</h4>' },
            { regex: /^###\s+(.*)$/gm, replace: '<h3>$1</h3>' },
            { regex: /^##\s+(.*)$/gm, replace: '<h2>$1</h2>' },
            { regex: /^#\s+(.*)$/gm, replace: '<h1>$1</h1>' },
            { regex: /\*\*\*(.*?)\*\*\*/g, replace: '<strong><em>$1</em></strong>' },
            { regex: /\*\*(.*?)\*\*/g, replace: '<strong>$1</strong>' },
            { regex: /\*(.*?)\*/g, replace: '<em>$1</em>' },
            { regex: /__([^_]+)__/g, replace: '<strong>$1</strong>' },
            { regex: /_([^_]+)_/g, replace: '<em>$1</em>' },
            { regex: /`([^`]+)`/g, replace: '<code>$1</code>' },
            { regex: /^>\s+(.*)$/gm, replace: '<blockquote>$1</blockquote>' },
            { regex: /(!\[(.*?)\]\((.*?)\))/g, replace: '<img src="$3" alt="$2">' },
            { regex: /(\[(.*?)\]\((.*?)\))/g, replace: '<a href="$3" target="_blank">$2</a>' }
        ];
    }

    parse(markdownText) {
        if (!markdownText) return '';
        
        let html = markdownText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        html = this._parseCodeBlocks(html);

        for (const rule of this.rules) {
            html = html.replace(rule.regex, rule.replace);
        }

        html = html.replace(/^(\s*[-\*\d\.\s]+)\s+(.*)$/gm, (match, prefix, content) => {
            if (/^-\s+|\*\s+/.test(prefix.trim()) || /^\d+\.\s+/.test(prefix.trim())) {
                return `<li>${content}</li>`;
            }
            return match;
        });

        html = html.replace(/((?:<li>.*<\/li>\n*)+)/g, (match) => {
            return `<ul>\n${match}</ul>\n`;
        });

        html = html.replace(/^(?!<(h[1-6]|li|blockquote|img|a|code|pre|ul|ol|div))([^\n]+)$/gm, '<p>$2</p>');

        return html.trim();
    }

    _parseCodeBlocks(text) {
        return text.replace(/```([\s\S]*?)```/g, (match, code) => {
            const cleanCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<pre><code>${cleanCode.trim()}</code></pre>`;
        });
    }
}
