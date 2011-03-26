function(doc, req){
  req.body = req.body.replace(/<.*?>/,"");
  var codez = new XML(req.body);
  var atom = new Namespace('http://www.w3.org/2005/Atom');
  var poco = new Namespace('http://portablecontacts.net/spec/1.0');
  var profile = {
    nickname: codez..atom::author.atom::name.toString(),
    url: codez..poco::urls.poco::value.toString(),
    gravatar_url: codez..atom::logo.toString()
  }
  var hostname = codez..atom::link.(@rel == 'alternate')[1].@href.toString().split("/")[2];
  var message = codez..atom::entry.atom::title.toString();
  var created_at = new Date();
  if (profile.gravatar_url.length > 0){
    return [{_id:req.uuid, created_at:created_at, xml:req.body, profile:profile, message:message, hostname:hostname, type:"pubsub"}, "posted"]
  };
}