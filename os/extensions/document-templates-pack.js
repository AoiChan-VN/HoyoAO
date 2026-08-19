/**
 * Document Templates Pack — a real resource-pack extension (§61).
 *
 * Demonstrates the Extension System end-to-end:
 *   register → activate(context) → register resources via scoped context.
 *
 * Declares only the "resources" capability (§62 least privilege). The
 * scoped context provides ResourceService and nothing else.
 *
 * The templates are real resource data with explicit ownership, version,
 * and type — not fake production data (§45).
 */

import { EXTENSION_TYPES } from './contract.js';

export const documentTemplatesPack = {
  id: 'pack-os-document-templates',
  type: EXTENSION_TYPES.RESOURCE_PACK,
  version: '1.0.0',
  description: 'Provides built-in document templates as OS resources.',
  owner: 'os',
  capabilities: ['resources'],
  dependencies: [],

  resources: [
    {
      id: 'res-template-report',
      name: 'Report Template',
      type: 'template',
      version: '1.0.0',
      mimeType: 'text/markdown',
      tags: ['template', 'report'],
      content: '# Report Title\n\n## Summary\n\n## Findings\n\n## Recommendations\n',
    },
    {
      id: 'res-template-readme',
      name: 'README Template',
      type: 'template',
      version: '1.0.0',
      mimeType: 'text/markdown',
      tags: ['template', 'readme'],
      content: '# Project Name\n\n## Overview\n\n## Installation\n\n## Usage\n\n## License\n',
    },
    {
      id: 'res-template-changelog',
      name: 'Changelog Template',
      type: 'template',
      version: '1.0.0',
      mimeType: 'text/markdown',
      tags: ['template', 'changelog'],
      content: '# Changelog\n\n## [Unreleased]\n\n### Added\n\n### Changed\n\n### Fixed\n',
    },
  ],

  /**
   * Called by ExtensionService with a capability-scoped context (§62).
   * @param {Readonly<object>} context
   */
  activate(context) {
    if (!context.resources) {
      throw new Error('document-templates-pack requires the "resources" capability');
    }
    for (const res of this.resources) {
      context.resources.registerResource({ ...res, owner: this.owner });
    }
  },

  /**
   * Resources remain registered; resource installation and extension
   * activation are separately controllable (§84).
   */
  deactivate() {
    // No teardown required for inline template resources.
  },
}; 
