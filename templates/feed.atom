<?xml version="1.0" encoding="UTF-8"?>
<feed xml:lang="en-US" xmlns="http://www.w3.org/2005/Atom" xmlns:thr="http://purl.org/syndication/thread/1.0" xmlns:georss="http://www.georss.org/georss" xmlns:activity="http://activitystrea.ms/spec/1.0/" xmlns:media="http://purl.org/syndication/atommedia" xmlns:poco="http://portablecontacts.net/spec/1.0" xmlns:ostatus="http://ostatus.org/schema/1.0">
  <generator uri="http://{{domain}}" version="0.1alpha">CouchAppSpora</generator>
  <id>http://{{domain}}/feeds/{{username}}</id>
  <title>{{username}} timeline</title>
  <subtitle>Updates from {{username}}</subtitle>
  <logo>{{gravatar}}</logo>
  <updated>{{updated_at}}</updated>
  <author>
    <name>{{username}}</name>
    <uri>http://{{domain}}/users/{{username}}</uri>
  </author>
  <link href="http://pubsubhubbub.appspot.com/" rel="hub"/>
  <link href="http://{{domain}}/salmon/{{username}}" rel="http://salmon-protocol.org/ns/salmon-replies"/>
  <link href="http://{{domain}}/salmon/{{username}}" rel="http://salmon-protocol.org/ns/salmon-mention"/>
  <link href="http://{{domain}}/feeds/{{username}}" rel="self" type="application/atom+xml"/>
  <activity:subject>
    <activity:object-type>http://activitystrea.ms/schema/1.0/person</activity:object-type>
    <id>http://{{domain}}/users/{{username}}</id>
    <title>{{username}}</title>
    <link ref="alternate" type="text/html" href="http://{{domain}}/users/{{username}}" />
    <link rel="avatar" type="image/jpeg" media:width="178" media:height="178" href="{{gravatar}}"/>
    <link rel="avatar" type="image/png" media:width="96" media:height="96" href="{{gravatar}}"/>
    <link rel="avatar" type="image/png" media:width="48" media:height="48" href="{{gravatar}}"/>
    <link rel="avatar" type="image/png" media:width="24" media:height="24" href="{{gravatar}}"/>
  <poco:preferredUsername>{{username}}</poco:preferredUsername>
  <poco:displayName>{{username}}</poco:displayName>
  <poco:note>{{note}}</poco:note>
  <poco:address>
   <poco:formatted>{{address}}</poco:formatted>
  </poco:address>
  <poco:urls>
   <poco:type>http://identi.ca/{{username}}</poco:type>
   <poco:value>http://{{domain}}/users/{{username}}</poco:value>
   <poco:primary>true</poco:primary>
   
  </poco:urls>
  </activity:subject>
  {{#entries}}
  <entry>
    <title>{{entry_title}}</title>
    <link rel="alternate" type="text/html" href="{{entry_url}}"/>
    <id>{{entry_url}}</id>
    <published>{{entry_published}}</published>
    <updated>{{entry_updated}}</updated>
    <content type="html">{{entry_content}}</content>
    <activity:verb>http://activitystrea.ms/schema/1.0/post</activity:verb>
    <activity:object-type>http://activitystrea.ms/schema/1.0/note</activity:object-type>
    <statusnet:notice_info local_id="{{entry_id}}" source="web"></statusnet:notice_info>
    <link rel="ostatus:conversation" href="{{conversation_url}}"/>
    <category term="statusnet"></category>
    <georss:point>{{lat}} {{lon}}</georss:point>
  </entry>
  {{/entries}}
</feed>