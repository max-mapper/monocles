function(doc) {
  if(doc.params.source==="publicalerts"){
    emit(doc.params.source, doc);
  }
}