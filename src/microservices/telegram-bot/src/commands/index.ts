import createDocument from './create-document';
import findDocuments from './find-documents';
import editDocument from './edit-document';
import deleteDocument from './delete-document';
import cancel from './cancel';

const commands = [
    createDocument,
    findDocuments,
    editDocument,
    deleteDocument,
    cancel,
];

export default commands;
