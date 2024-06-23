import DocumentsGetQuery from './documents.get';
import DocumentsFindQuery from './documents.find';
import DocumentsCreateQuery from './documents.create';
import DocumentsUpdateQuery from './documents.update';
import DocumentsDeleteQuery from './documents.delete';

import WebServerMakeLinkToFile from './web-server.make-link-to-file';

interface Queries {
    'documents.get': DocumentsGetQuery;
    'documents.create': DocumentsCreateQuery;
    'documents.find': DocumentsFindQuery;
    'documents.update': DocumentsUpdateQuery;
    'documents.delete': DocumentsDeleteQuery;

    'web-server.make-link-to-file': WebServerMakeLinkToFile;
}

export default Queries;
