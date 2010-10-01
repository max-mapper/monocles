function(doc, req) {
  if(doc.params && doc.params.source==="publicalerts"){
    return true;
  }
  else {
    return false;
  }
}