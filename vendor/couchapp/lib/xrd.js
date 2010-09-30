// XRD generator for webfinger
// requires E4X support
// by @maxogden

exports.generate = function(url) {
  var xrd = <XRD xmlns='http://docs.oasis-open.org/ns/xri/xrd-1.0'
       xmlns:hm='http://host-meta.net/xrd/1.0'>
    <hm:Host xmlns='http://host-meta.net/xrd/1.0'></hm:Host>
    <Link rel='lrdd'>
      <Title>Resource Descriptor</Title>
    </Link>
  </XRD>;
  var XRDNS = new Namespace('http://docs.oasis-open.org/ns/xri/xrd-1.0');
  var XRDNSHM = new Namespace('http://host-meta.net/xrd/1.0');
  xrd..XRDNS::Link.@template = 'http://' + url + '/webfinger/?q={uri}';
  xrd..XRDNSHM::Host.setChildren(url);
  return xrd;
}