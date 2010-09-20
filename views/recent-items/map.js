function(doc) {
  if (doc.created_at && !doc.parent_id) {
    emit(doc.updated_at || doc.created_at, doc);
  }
};
