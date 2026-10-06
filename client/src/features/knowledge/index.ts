export { default as KnowledgeManager } from './components/KnowledgeManager.vue';
export { useDeleteDocument, useDocuments, useUploadDocument } from './composables/useKnowledge';
export { ACCEPTED_DOCUMENTS, formatSize, MAX_DOCUMENT_SIZE, type KnowledgeDocument } from './types';
