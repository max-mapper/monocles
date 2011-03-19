function(doc, req){
  var Base64 = require("vendor/base64");
  req.body = req.body.replace(/<.*?>/,"");
  var codez = new XML(req.body);
  var atom = new Namespace('http://www.w3.org/2005/Atom');
  var poco = new Namespace('http://portablecontacts.net/spec/1.0');
  var me = new Namespace('http://salmon-protocol.org/ns/magic-env');
  var thr = new Namespace('http://purl.org/syndication/thread/1.0');
  var activity = new Namespace('http://activitystrea.ms/spec/1.0/');
  var data = codez..me::data.toString();
  function tr(str, from, to) {
    var subst;
    for (i = 0; i < from.length; i++) {
        subst = (to[i]) ? to[i] : to[to.length-1];
        str = str.replace(new RegExp(str[str.indexOf(from[i])], 'g'), subst);
    }
    return str;
  }
  var striped = tr(data, "-_,","+/=");
  var decoded = new XML(Base64.client.decode(striped).replace(/<.*?>/,"").replace(/in-reply-to/g,"reply"));
  var profile = {
    name: decoded..atom::author.atom::name.toString(),
    url: decoded..atom::author.atom::uri.toString(),
    gravatar_url: decoded..activity::actor.atom::link.(@rel == 'avatar')[0].@href.toString()
  }
  var parent_id = decoded..thr::reply.@ref.toString().split("/");
  parent_id = parent_id[parent_id.length-1];
  var hostname = profile.url.split("/")[2];
  var message = decoded..atom::content.toString().replace(/<.*?>/g,"");
  var created_at = new Date();
  return [{_id:req.uuid, created_at:created_at, xml:req.body, decoded:decoded.toString(), hostname:hostname, profile:profile, message:message, parent_id:parent_id }, "posted"]
}