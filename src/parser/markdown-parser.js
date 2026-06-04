export class SafeMarkdownParser {
  static parse(md) {
    if (!md) return '';

    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/gim, '');

    html = html.replace(/```javascript([\s\S]*?)```/gim, '<pre><code class="language-javascript">$1</code></pre>');
    html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');

    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    html = html.replace(/`(.*?)`/gim, '<code>$1</code>');

    html = html.replace(/&lt;br\s*\/&gt;/gim, '<br/>');

    const paragraphs = html.split(/\n{2,}/g);
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i].trim();
      if (p && !p.startsWith('<h') && !p.startsWith('<ul') && !p.startsWith('<pre') && !p.startsWith('<li')) {
        paragraphs[i] = `<p>${p}</p>`;
      }
    }
    html = paragraphs.join('\n');

    return this.sanitize(html);
  }

  static sanitize(html) {
    const allowedTags = /<\/?(p|h1|h2|h3|strong|em|code|pre|ul|li|br)( [^>]*)*>/gim;
    return html.replace(/<[^>]+>/g, (match) => {
      if (match.match(allowedTags)) {
        return match.replace(/on\w+\s*=/gim, 'data-clean=');
      }
      return '';
    });
  }
}
 
