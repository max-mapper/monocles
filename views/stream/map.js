function(doc) {
  if (doc.type && doc.type === "note" || doc.type === "follow") {
    emit(doc.updated_at || doc.created_at, doc);
  }
}
