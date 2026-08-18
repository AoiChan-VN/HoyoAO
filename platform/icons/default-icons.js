/**
 * Default OS Icon Pack (§35, §20)
 *
 * A minimal, theme-able SVG icon set used by the OS Shell.
 * All icons use stroke="currentColor" so they inherit text color (§21).
 * Applications may register additional icons via the IconRegistry.
 */

const WRAP_OPEN =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
const WRAP_CLOSE = '</svg>';

const icon = (body) => WRAP_OPEN + body + WRAP_CLOSE;

export const DEFAULT_ICONS = {
  // OS navigation
  'settings': icon(
    '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>' +
    '<line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>' +
    '<line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>' +
    '<line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>' +
    '<line x1="17" y1="16" x2="23" y2="16"/>'
  ),

  'diagnostics': icon(
    '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'
  ),

  // Applications
  'dashboard': icon(
    '<rect x="3" y="3" width="7" height="7"/>' +
    '<rect x="14" y="3" width="7" height="7"/>' +
    '<rect x="14" y="14" width="7" height="7"/>' +
    '<rect x="3" y="14" width="7" height="7"/>'
  ),

  'app': icon(
    '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>'
  ),

  // Status / feedback
  'info': icon(
    '<circle cx="12" cy="12" r="10"/>' +
    '<line x1="12" y1="16" x2="12" y2="12"/>' +
    '<line x1="12" y1="8" x2="12.01" y2="8"/>'
  ),

  'success': icon('<polyline points="20 6 9 17 4 12"/>'),

  'warning': icon(
    '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>' +
    '<line x1="12" y1="9" x2="12" y2="13"/>' +
    '<line x1="12" y1="17" x2="12.01" y2="17"/>'
  ),

  'error': icon(
    '<circle cx="12" cy="12" r="10"/>' +
    '<line x1="15" y1="9" x2="9" y2="15"/>' +
    '<line x1="9" y1="9" x2="15" y2="15"/>'
  ),

  // Actions
  'close': icon(
    '<line x1="18" y1="6" x2="6" y2="18"/>' +
    '<line x1="6" y1="6" x2="18" y2="18"/>'
  ),

  'chevron-right': icon('<polyline points="9 18 15 12 9 6"/>'),
  'chevron-down': icon('<polyline points="6 9 12 15 18 9"/>'),
}; 
