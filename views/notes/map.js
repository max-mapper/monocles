function(doc) {
  if (doc.type === "note") {
    emit(doc.updated_at || doc.created_at, doc);
  }
}
