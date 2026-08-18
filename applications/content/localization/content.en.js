/**
 * Content localization strings (§37).
 * Registered with the OS LocalizationService under the "en" locale.
 * Keys are namespaced with "content." to avoid collisions (§64).
 */
export default {
  'content.title': 'Content',
  'content.subtitle': 'Articles, files, and resources',

  'content.loading': 'Loading content…',

  'content.empty.title': 'No content available',
  'content.empty.description':
    'No content source is connected. In development mode a simulated library is shown. ' +
    'In production, connect a content source via a ContentDataProvider.',

  'content.error.title': 'Failed to load content',
  'content.error.description': 'The content source returned an error.',

  'content.noResults': 'No items match your search or filters.',

  'content.source.simulated': 'Simulated data (development)',
  'content.source.real': 'Live data',

  'content.search.label': 'Search',
  'content.search.placeholder': 'Search title, excerpt, tags, author…',

  'content.filter.category': 'Category',
  'content.filter.type': 'Type',
  'content.filter.allCategories': 'All categories',
  'content.filter.allTypes': 'All types',

  'content.type.article': 'Article',
  'content.type.image': 'Image',
  'content.type.file': 'File',
  'content.type.document': 'Document',
  'content.type.media': 'Media',

  'content.status.published': 'Published',
  'content.status.draft': 'Draft',
  'content.status.archived': 'Archived',

  'content.detail.id': 'Identity',
  'content.detail.category': 'Category',
  'content.detail.author': 'Author',
  'content.detail.mimeType': 'MIME type',
  'content.detail.size': 'Size',
  'content.detail.createdAt': 'Created',
  'content.detail.updatedAt': 'Updated',
  'content.detail.tags': 'Tags',
  'content.detail.excerpt': 'Excerpt',
}; 
