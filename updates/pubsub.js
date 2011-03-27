function(head, req) {
  var xml2js = require('vendor/xml2js');
  var json;

  new xml2js.Parser(function(data) {
    json = [{_id:req.uuid, created_at: new Date(), data:data, type:"pubsub"}, "posted"];
  }).parseString(req.body);

  return json;
}