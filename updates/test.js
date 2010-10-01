function(doc, req){
  return [{_id:req.uuid, xml:req.body, params: req.query, type:"pubsub"}, "posted"]
}