function(doc, req){
  return [{_id:req.uuid, xml:req.body, type:"pubsub"}, "posted"]
}