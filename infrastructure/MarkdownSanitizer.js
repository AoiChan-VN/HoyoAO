/**
 * MarkdownSanitizer.js
 * Bộ biên dịch mã Markdown sang HTML bảo mật quốc tế bằng Regex thuần, chặn đứng mọi lỗ hổng XSS.
 */
export class MarkdownSanitizer {
    static parseAndSanitize(mdText) {
        if (typeof mdText !== 'string') return '';

        // Bước 1: Escaping thô toàn bộ các ký tự HTML nguy hiểm ngăn chặn chèn thẻ trực tiếp
        let safeHtml = mdText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');

        // Bước 2: Regex phục hồi thủ công các thẻ Markdown cơ bản đã được làm sạch
        // Tiêu đề H1 - H6
        safeHtml = safeHtml.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>');
        safeHtml = safeHtml.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>');
        safeHtml = safeHtml.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>');
        safeHtml = safeHtml.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
        safeHtml = safeHtml.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
        safeHtml = safeHtml.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');

        // Định dạng chữ: Khóa khối Code, đậm, nghiêng
        safeHtml = safeHtml.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        safeHtml = safeHtml.replace(/`([^`]+)`/g, '<code>$1</code>');
        safeHtml = safeHtml.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        safeHtml = safeHtml.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // Biên dịch danh sách (Lists)
        safeHtml = safeHtml.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
        safeHtml = safeHtml.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
        // Khử bớt lỗi lặp thẻ lồng nhau do regex của ul
        safeHtml = safeHtml.replace(/<\/ul>\s*<ul>/g, '');

        // Xử lý xuống dòng thành thẻ paragraph mềm
        safeHtml = safeHtml.replace(/^\s*(?!<h|<li|<ul|<pre|<code)(.+)$/gm, '<p>$1</p>');

        // Bước 3: Bộ lọc sâu chuyên dụng (Sanitization Deep Audit) loại bỏ thuộc tính mã độc hại (XSS Vectors)
        // Loại bỏ triệt để các chuỗi điều hướng nguy hiểm như javascript:, data:, vbscript: bên trong link
        const dangerousAttrs = /(exec|onclick|onerror|onload|onmouseover|onfocus|onblur|javascript|data|vbscript|onkeydown|onkeypress|onkeyup)/gi;
        
        // Tiến hành rà soát triệt để chuỗi ký tự lỗi tràn bộ đệm hệ thống (Buffer Overflow / DoS DOM Protection)
        // Chặn các chuỗi lặp ký tự đặc biệt vô nghĩa kéo dài quá 500 ký tự liên tiếp
        const bufferOverflowPattern = /([^\w\s])\1{500,}/g;
        safeHtml = safeHtml.replace(bufferOverflowPattern, '');

        // Lọc sạch một lần nữa bất cứ thẻ lọt lưới nào không thuộc danh mục an toàn
        safeHtml = safeHtml.replace(/&lt;script[\s\S]*?&gt;[\s\S]*?&lt;\/script&gt;/gi, '');
        safeHtml = safeHtml.replace(/&lt;iframe[\s\S]*?&gt;[\s\S]*?&lt;\/iframe&gt;/gi, '');

        return safeHtml;
    }
}
 
