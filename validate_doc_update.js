function ( newDoc, oldDoc, userCtx, secObj ) {
  var v = require( "vendor/validate" ).init( newDoc, oldDoc, userCtx, secObj );
  
  if ( v.isAdmin() ) return;
  
  if( ! userCtx.name ) {
    // CouchDB sets userCtx.name only after a successful authentication
    v.unauthorized( "Please log in first." );
  }
  
  // if( oldDoc && oldDoc.profile.name !== userCtx.name ) {
  //   v.unauthorized( "You are not the author" );  
  // }
  
  // if ( ( oldDoc && oldDoc.type === "comment" ) || ( oldDoc && oldDoc.type === "note" ) ) {
  //   v.unauthorized( "You can't edit that" );
  // }
  
}