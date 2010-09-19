function(doc) {
  if (doc.created_at && !doc.parent_id) {
    emit(doc.created_at, doc);
  }
};
