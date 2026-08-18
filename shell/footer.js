/**
 * Shell Footer (§78, §20)
 *
 * Branding is configuration-driven (§79). Logo resolved through
 * AssetRegistry by name — never hardcoded (§20, §35).
 */

export class ShellFooter {
  #brand;
  #localization;
  #assets;

  constructor(brand, localization, assets) {
    this.#brand = brand;
    this.#localization = localization;
    this.#assets = assets;
  }

  render() {
    const footer = document.createElement('footer');
    footer.className = 'os-shell__footer';

    /* Line 1 */
    const line1 = document.createElement('div');
    line1.className = 'os-shell__footer-line';

    const status = document.createElement('span');
    status.className = 'os-shell__footer-status';
    status.textContent = this.#localization.t('footer.status');

    const sep = document.createElement('span');
    sep.className = 'os-shell__footer-separator';
    sep.textContent = '|';
    sep.setAttribute('aria-hidden', 'true');

    const support = document.createElement('a');
    support.className = 'os-shell__footer-link';
    support.href = this.#brand.links?.support ?? '#';
    support.textContent = this.#localization.t('footer.support');

    line1.append(status, sep, support);

    /* Line 2 */
    const line2 = document.createElement('div');
    line2.className = 'os-shell__footer-line os-shell__footer-copyright';

    const logoUrl = this.#brand.logoAsset
      ? this.#assets.resolve(this.#brand.logoAsset)
      : null;

    if (logoUrl) {
      const logo = document.createElement('img');
      logo.src = logoUrl;
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
