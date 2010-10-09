function(doc) {
    if (doc.created_at && doc.parent_id) {
        emit([doc.parent_id, doc.created_at], doc);
    }
}