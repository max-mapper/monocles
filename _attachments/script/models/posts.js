/*global jive */

function posts(db) {
  var pub = {};

  pub.save = function(comment) {
    var promise = new jive.conc.Promise();

    db.saveDoc(comment, {
      success : function(savedComment) {
        promise.emitSuccess(savedComment);
      },

      error : function(status, textStatus, explanation) {
        promise.emitError(status, textStatus, explanation);
      }
    });

    return promise;
  };

  // Updates a document given a map of attributes to update.
  pub.update = function(id, attrs) {
    var promise = new jive.conc.Promise();

    db.openDoc(id, {
      success : function(doc) {
        Object.keys(attrs).forEach(function(k) {
          if (typeof attrs[k] == 'function') {
            doc[k] = attrs[k](doc);
          } else {
            doc[k] = attrs[k];
          }
        });

        db.saveDoc(doc, {
          success : function(savedDoc) {
            promise.emitSuccess(savedDoc);
          },

          error : function(status, textStatus, explanation) {
            if (status == 409) {
              // when a conflict occurs try again
              pub.update(id, attrs);
            } else {
              promise.emitError(status, textStatus, explanation);
            }
          }
        });
      },

      error : function(status, textStatus, explanation) {
        promise.emitError(status, textStatus, explanation);
      }
    });

    return promise;
  };

  return pub;
}
