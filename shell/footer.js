/**
 * Shell Footer (§78)
 *
 * Line 1: Status | Support & Community
 * Line 2: [Logo] © 2026 HoyoAO. All Rights Reserved
 *
 * All branding is configuration-driven (§79).
 */

export class ShellFooter {
  #brand;

  constructor(brand) {
    this.#brand = brand;
  }

  render() {
    const footer = document.createElement('footer');
    footer.className = 'os-shell__footer';

    /* Line 1 */
    const line1 = document.createElement('div');
    line1.className = 'os-shell__footer-line';

    const status = document.createElement('span');
    status.className = 'os-shell__footer-status';
    status.textContent = 'Status';

    const sep = document.createElement('span');
    sep.className = 'os-shell__footer-separator';
    sep.textContent = '|';
    sep.setAttribute('aria-hidden', 'true');

    const support = document.createElement('a');
    support.className = 'os-shell__footer-link';
    support.href = this.#brand.links?.support ?? '#';
    support.textContent = 'Support & Community';

    line1.append(status, sep, support);

    /* Line 2 */
    const line2 = document.createElement('div');
    line2.className = 'os-shell__footer-line os-shell__footer-copyright';

    if (this.#brand.logo?.src) {
      const logo = document.createElement('img');
      logo.src = this.#brand.logo.src;
      logo.alt = '';
      logo.className = 'os-shell__footer-logo';
      line2.appendChild(logo);
    }

    const copy = document.createElement('span');
    copy.textContent = this.#brand.copyright ?? '';
    line2.appendChild(copy);

    footer.append(line1, line2);
    return footer;
  }
} 
