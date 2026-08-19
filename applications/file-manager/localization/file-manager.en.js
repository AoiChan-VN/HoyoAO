/**
 * File Manager localization strings (§37).
 * Registered with the OS LocalizationService under the "en" locale.
 * Keys are namespaced with "fileManager." to avoid collisions (§64).
 */
export default {
  'fileManager.title': 'File Manager',
  'fileManager.subtitle': 'Browse, search, and inspect virtual files',

  'fileManager.loading': 'Loading files…',

  'fileManager.empty.title': 'No files available',
  'fileManager.empty.description':
    'No file source is connected. In development mode a simulated file library is shown. ' +
    'In production, connect a file source via a FileDataProvider.',

  'fileManager.error.title': 'Failed to load files',
  'fileManager.error.description': 'The file source returned an error.',

  'fileManager.noResults': 'No files match your search or filters.',

  'fileManager.source.simulated': 'Simulated data (development)',
  'fileManager.source.real': 'Live data',

  'fileManager.search.label': 'Search',
  'fileManager.search.placeholder': 'Search by file name…',

  'fileManager.filter.category': 'Category',
  'fileManager.filter.allCategories': 'All categories',

  'fileManager.summary.total': 'Files',
  'fileManager.summary.totalSize': 'Total size',

  'fileManager.category.documents': 'Documents',
  'fileManager.category.images': 'Images',
  'fileManager.category.media': 'Media',
  'fileManager.category.archives': 'Archives',
  'fileManager.category.other': 'Other',

  'fileManager.status.available': 'Available',
  'fileManager.status.offline': 'Offline',
  'fileManager.status.syncing': 'Syncing',

  'fileManager.detail.id': 'Identity',
  'fileManager.detail.mimeType': 'MIME type',
  'fileManager.detail.size': 'Size',
  'fileManager.detail.path': 'Virtual path',
  'fileManager.detail.createdAt': 'Created',
  'fileManager.detail.modifiedAt': 'Modified',
}; 
