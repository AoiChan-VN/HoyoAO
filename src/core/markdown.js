/**
 * ==========================================================================
 * SECURE TOKENIZER ENGINE (MARKDOWN PARSER SUBSYSTEM)
 * Trình dịch văn bản Markdown tĩnh sang HTML5 bảo mật hiệu năng cao.
 * Không phụ thuộc thư viện ngoài, tích hợp bộ lọc phòng chống lỗ hổng XSS.
 * ==========================================================================
 */

export class SpatialMarkdownEngine {
    constructor() {
        // Biểu thức chính quy (Regex) bóc tách các token cấu trúc Markdown cơ bản
        this.rules = [
            { regex: /^### (.*$)/gim, replace: '<h3 class="spatial-hud-h3">$1</h3>' },
            { regex: /^## (.*$)/gim, replace: '<h2 class="spatial-hud-h2">$1</h2>' },
            { regex: /^# (.*$)/gim, replace: '<h1 class="spatial-hud-h1">$1</h1>' },
            { regex: /^\s*-\s+(.*$)/gim, replace: '<li class="spatial-hud-li">$1</li>' },
            { regex: /\*\*(.*?)\*\*/gim, replace: '<strong class="spatial-hud-strong">$1</strong>' },
            { regex: /\*(.*?)\*/gim, replace: '<em class="spatial-hud-em">$1</em>' },
            { regex: /\[(.*?)\]\((.*?)\)/gim, replace: '<a class="spatial-hud-link" href="$2" target="_blank" rel="noopener noreferrer">$1</a>' }
        ];
    }

    /**
     * Phương thức làm sạch chuỗi thô để chống chèn mã độc XSS trước khi parse HTML
     * @param {string} rawString Chuỗi văn bản thô từ file Markdown
     * @returns {string} Chuỗi văn bản an toàn
     */
    sanitize(rawString) {
        if (!rawString) return '';
        return rawString
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Trình biên dịch chính chuỗi Markdown sang định dạng HTML5 có cấu trúc
     * @param {string} markdownText Văn bản cấu trúc Markdown thô
     * @returns {string} Chuỗi mã HTML hoàn chỉnh có thể gán vào DOM an toàn
     */
    parse(markdownText) {
        if (!markdownText) return '';

        // Bước 1: Làm sạch chuỗi gốc để chặn đứng các cuộc tấn công Script Injection
        let sanitizedText = this.sanitize(markdownText.trim());

        // Tách văn bản thành mảng các dòng để xử lý chính xác theo khối
        const lines = sanitizedText.split(/\r?\n/);
        let inList = false;
        let htmlOutput = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let isListItem = /^\s*-\s+(.*$)/.test(line);

            // Kiểm tra trạng thái đóng/mở của thẻ danh sách <ul> nhằm tối ưu tính hợp lệ của HTML
            if (isListItem && !inList) {
                htmlOutput.push('<ul class="spatial-hud-ul">');
                inList = true;
            } else if (!isListItem && inList) {
                htmlOutput.push('</ul>');
                inList = false;
            }

            // Thực thi quét và thay thế các Token cấu trúc qua mảng Regex Rules
            let parsedLine = line;
            for (const rule of this.rules) {
                // Tạm thời khôi phục lại các ký tự điều hướng của thẻ HTML do hàm sanitize tạo ra trước đó
                // nhưng CHỈ khôi phục cho các cấu trúc khớp chính xác với bộ luật Markdown an toàn.
                if (rule.regex.toString().includes('href') && rule.regex.test(parsedLine)) {
                    parsedLine = parsedLine.replace(rule.regex, (match, text, url) => {
                        const cleanUrl = url.replace(/&amp;/g, '&');
                        return `<a class="spatial-hud-link" href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
                    });
                } else {
                    parsedLine = parsedLine.replace(rule.regex, rule.replace);
                }
            }

            // Nếu dòng trống và không nằm trong khối đặc biệt, dịch thành thẻ xuống dòng ngắt đoạn
            if (parsedLine === '' && !inList) {
                htmlOutput.push('<div class="spatial-hud-spacer"></div>');
            } else if (parsedLine !== '') {
                // Nếu không trùng khớp quy tắc nào thì bọc dòng văn bản thường vào thẻ paragraph
                if (!parsedLine.startsWith('<h') && !parsedLine.startsWith('<li') && !parsedLine.startsWith('<ul') && !parsedLine.startsWith('<div')) {
                    htmlOutput.push(`<p class="spatial-hud-p">${parsedLine}</p>`);
                } else {
                    htmlOutput.push(parsedLine);
                }
            }
        }

        // Đảm bảo đóng thẻ danh sách <ul> nếu file kết thúc đột ngột
        if (inList) {
            htmlOutput.push('</ul>');
        }

        return htmlOutput.join('\n');
    }
}
 
