/**
 * FileSummaryBar — totals and distribution.
 * Answers: "How many files exist, what is the total size, and how are they distributed?" (§77)
 */

import { createBadge } from '../../../../platform/ui/badge.js';
import { formatBytes } from '../utils/format.js';

export function createFileSummaryBar(options = {}) {
  const { localization } = options;

  const bar = document.createElement('div');
  bar.className = 'file-manager__summary-bar';

  const statsWrap = document.createElement('div');
  statsWrap.className = 'file-manager__summary-stats';

  const badgeWrap = document.createElement('div');
  badgeWrap.className = 'file-manager__summary-badge';

  bar.append(statsWrap, badgeWrap);

  const statEls = {};

  function buildStat(labelKey) {
    const stat = document.createElement('div');
    stat.className = 'file-manager__summary-stat';

    const value = document.createElement('div');
    value.className = 'file-manager__summary-stat-value';
    value.textContent = '0';

    const label = document.createElement('div');
    label.className = 'file-manager__summary-stat-label';
    label.textContent = localization.t(labelKey);

    stat.append(value, label);
    statsWrap.appendChild(stat);
    return value;
  }

  statEls.total = buildStat('fileManager.summary.total');
  statEls.size = buildStat('fileManager.summary.totalSize');
  statEls.documents = buildStat('fileManager.category.documents');
  statEls.images = buildStat('fileManager.category.images');
  statEls.media = buildStat('fileManager.category.media');
  statEls.archives = buildStat('fileManager.category.archives');

  function update(files, isSimulated) {
    const total = files.length;
    let totalSize = 0;
    const byCategory = { documents: 0, images: 0, media: 0, archives: 0, other: 0 };

    for (const f of files) {
      totalSize += f.size || 0;
      if (byCategory[f.category] !== undefined) byCategory[f.category]++;
      else byCategory.other++;
    }

    statEls.total.textContent = String(total);
    statEls.size.textContent = formatBytes(totalSize);
    statEls.documents.textContent = String(byCategory.documents);
    statEls.images.textContent = String(byCategory.images);
    statEls.media.textContent = String(byCategory.media);
    statEls.archives.textContent = String(byCategory.archives);

    // Data source label (§45) — never hide that data is simulated.
    badgeWrap.innerHTML = '';
    const badge = createBadge({
      label: isSimulated
        ? localization.t('fileManager.source.simulated')
        : localization.t('fileManager.source.real'),
      variant: isSimulated ? 'warning' : 'success',
    });
    badgeWrap.appendChild(badge.element);
  }

  function destroy() {
    bar.innerHTML = '';
  }

  return { element: bar, update, destroy };
}
