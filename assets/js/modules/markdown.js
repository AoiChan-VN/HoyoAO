export class MarkdownParser {
    static sanitize(html) {
        // Chống tấn công XSS injection thực thi mã từ file data local độc hại
        return html
            .replace(/<script[^>]*?>[\s\S]*?<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/javascript:/gi, '');
    }

    static parse(md) {
        let html = md
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>') // Bold
            .replace(/\*(.*)\*/gim, '<em>$1</em>') // Italic
            .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" />') // Images
            .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>') // Links
            .replace(/^\s*-\s(.*)$/gim, '<li>$1</li>'); // Unordered Lists

        return this.sanitize(html);
    }
}
 
