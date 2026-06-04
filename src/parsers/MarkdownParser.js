export class MarkdownParser {
    constructor() {
        this.htmlBuffer = '';
    }

    parse(markdownText) {
        if (!markdownText) return '';
        
        let lines = markdownText.split('\n');
        let htmlOutput = [];
        let inList = false;
        let inTable = false;
        let inCodeBlock = false;
        let inBlockquote = false;
        let codeBlockLanguage = '';
        let codeContent = [];
        let tableRows = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // 1. Xử lý Code Block
            if (line.trim().startsWith('```')) {
                if (inCodeBlock) {
                    htmlOutput.push(`<pre><code class="language-${codeBlockLanguage}">${this.escapeHtml(codeContent.join('\n'))}</code></pre>`);
                    codeContent = [];
                    inCodeBlock = false;
                } else {
                    codeBlockLanguage = line.trim().substring(3).trim();
                    inCodeBlock = true;
                }
                continue;
            }

            if (inCodeBlock) {
                codeContent.push(line);
                continue;
            }

            // Đóng các thẻ danh sách hoặc bảng nếu gặp dòng trống
            if (line.trim() === '') {
                if (inList) { htmlOutput.push('</ul>'); inList = false; }
                if (inBlockquote) { htmlOutput.push('</table>'); inBlockquote = false; }
                if (inTable) {
                    htmlOutput.push(this.renderTable(tableRows));
                    tableRows = [];
                    inTable = false;
                }
                continue;
            }

            // 2. Xử lý Blockquote
            if (line.trim().startsWith('>')) {
                let content = line.substring(line.indexOf('>') + 1).trim();
                if (!inBlockquote) {
                    htmlOutput.push('<blockquote>');
                    inBlockquote = true;
                }
                htmlOutput.push(`<p>${this.parseInline(content)}</p>`);
                continue;
            } else if (inBlockquote && !line.trim().startsWith('>')) {
                htmlOutput.push('</blockquote>');
                inBlockquote = false;
            }

            // 3. Xử lý Headings
            if (line.startsWith('#')) {
                let level = 0;
                while (line[level] === '#') level++;
                if (line[level] === ' ') {
                    let content = line.substring(level + 1).trim();
                    htmlOutput.push(`<h${level}>${this.parseInline(content)}</h${level}>`);
                    continue;
                }
            }

            // 4. Xử lý Unordered Lists
            if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                let content = line.trim().substring(2).trim();
                if (!inList) {
                    htmlOutput.push('<ul>');
                    inList = true;
                }
                htmlOutput.push(`<li>${this.parseInline(content)}</li>`);
                continue;
            }

            // 5. Xử lý Tables
            if (line.trim().startsWith('|')) {
                if (!inTable) {
                    inTable = true;
                }
                tableRows.push(line);
                continue;
            } else if (inTable && !line.trim().startsWith('|')) {
                htmlOutput.push(this.renderTable(tableRows));
                tableRows = [];
                inTable = false;
            }

            // 6. Xử lý Đường kẻ ngang (HR)
            if (line.trim() === '---' || line.trim() === '***') {
                htmlOutput.push('<hr />');
                continue;
            }

            // 7. Xử lý Đoạn văn mặc định (Paragraph)
            htmlOutput.push(`<p>${this.parseInline(line)}</p>`);
        }

        // Dọn dẹp các thẻ chưa đóng ở cuối file
        if (inList) htmlOutput.push('</ul>');
        if (inBlockquote) htmlOutput.push('</blockquote>');
        if (inTable) htmlOutput.push(this.renderTable(tableRows));

        return this.sanitize(htmlOutput.join('\n'));
    }

    parseInline(text) {
        let escaped = this.escapeHtml(text);
        
        // Bold (**text** hoặc __text__)
        escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        escaped = escaped.replace(/__(.*?)__/g, '<strong>$1</strong>');
        
        // Italic (*text* hoặc _text_)
        escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
        escaped = escaped.replace(/_(.*?)_/g, '<em>$1</em>');
        
        // Inline Code (`code`)
        escaped = escaped.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Links ([label](url))
        escaped = escaped.replace(/\[(.*?)\]\((.*?)\)/g, (match, label, url) => {
            const isLocal = url.startsWith('.') || url.startsWith('/') || url.startsWith('#');
            if (!isLocal) return label; // Chặn link ngoài theo yêu cầu thiết kế
            return `<a href="${url}" class="interactive-element">${label}</a>`;
        });

        return escaped;
    }

    renderTable(rows) {
        if (rows.length < 1) return '';
        let html = ['<table>'];
        
        let hasHeader = rows.length > 1 && rows[1].includes('---');
        let startIndex = 0;

        if (hasHeader) {
            html.push('<thead><tr>');
            let cols = rows[0].split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
            cols.forEach(col => html.push(`<th>${this.parseInline(col)}</th>`));
            html.push('</tr></thead>');
            startIndex = 2; // Bỏ qua dòng header và dòng gạch ngang phân tách
        }

        html.push('<tbody>');
        for (let i = startIndex; i < rows.length; i++) {
            if (!rows[i].trim()) continue;
            html.push('<tr>');
            let cols = rows[i].split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
            cols.forEach(col => html.push(`<td>${this.parseInline(col)}</td>`));
            html.push('</tr>');
        }
        html.push('</tbody></table>');
        return html.join('\n');
    }

    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    sanitize(html) {
        // Xóa bỏ triệt để các thẻ thực thi mã và các chuỗi kích hoạt script inline độc hại (XSS Filter)
        let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        cleanHtml = cleanHtml.replace(/on\w+\s*=\s*"(?:[^"]*)"/gi, '');
        cleanHtml = cleanHtml.replace(/on\w+\s*=\s*'(?:[^']*)'/gi, '');
        cleanHtml = cleanHtml.replace(/javascript:/gi, '');
        return cleanHtml;
    }
}
 
