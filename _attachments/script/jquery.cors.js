(function($) {

      // CORS AJAX clone
      $.cors = function(options) {
        // TODO If not CORS fallback to proxy or getJSON
        // TODO headers in options
        options.success = options.success || function(data, text) {alert('no success callback specified');}
        options.error = options.error || function(xhr, text, thrown) {alert('no fail callback specified');}
        $.ajax(options);
        $.ajaxSetup({
          xhr: (function(){
            var xhr = ( window.XMLHttpRequest && new window.XMLHttpRequest )
                        || ( window.XDomainRequest && new window.XDomainRequest )
                        || ( window.ActiveXObject && new window.ActiveXObject )
                        || {};
            var xhr2_capable = false;
            try {
              xhr2_capable = (xhr.withCredentials !== undefined);
            } catch (ignore) {
              xhr2_capable = true;
            }
            try {
              xhr2_capable = (xhr.responseBody !== undefined);
            } catch (ignore) {
              xhr2_capable = true;
            }
            if (!xhr_capable) {
              xhr = new jQuery.proxy_xmlhttp;
            }
            return xhr;
          }())
        });
      };
      $.corsSetup = function(options) {
        $.ajaxSetup(options);
      };

      // CORS Verbs
      $.getCORS = function(url, data, callback, type) {
        options = {
          url: url,
          type: 'GET',
          data: data,
          success: callback,
          dataType: type,
        };
        $.cors(options);
      };
      $.postCORS = function(url, data, callback, type) {
        options = {
          url: url,
          type: 'POST',
          data: data,
          success: callback,
          dataType: type,
        };
        $.cors(options);
      };
      $.putCORS = function(url, data, callback, type) {
        options = {
          url: url,
          type: 'PUT',
          data: data,
          success: callback,
          dataType: type,
        };
        $.cors(options);
      };
      $.deleteCORS = function(url, data, callback, type) {
        options = {
          url: url,
          type: 'DELETE',
          data: data,
          success: callback,
          dataType: type,
        };
        $.cors(options);
      };

      // CORS with JSON
      $.postJSON = function(url, data, callback) {
        $.ajaxSetup({
          contentType: 'application/json; charset=utf-8',
        });
        $.postCORS(url, JSON.stringify(data), callback, 'json');
      };
      $.putJSON = function(url, data, callback) {
        $.ajaxSetup({
          contentType: 'application/json; charset=utf-8',
        });
        $.putCORS(url, JSON.stringify(data), callback, 'json');
      };
      $.deleteJSON = function(url, data, callback) {
        $.deleteCORS(url, data, callback, 'json');
      };
      $.corsJSON = function(type, url, data, success, error) {
        $.ajaxSetup({
          error: error,
          contentType: 'application/json; charset=utf-8',
        });
        $.cors({
          type: type,
          url: url,
          data: data,
          dataType: 'json',
          success: success,
          error: error
        });
      }

})(jQuery);



// These are for quick reference only. They'll be removed in the future 
(function($) {
/**
 * This is for Cross-site Origin Resource Sharing (CORS) requests.
 *
 * Additionally the script will fail-over to a proxy if you have one set up.
 *
 * @param string   url      the url to retrieve
 * @param mixed    data     data to send along with the get request [optional]
 * @param function callback function to call on successful result [optional]
 * @param string   type     the type of data to be returned [optional]
 */
$.oldGetCORS = function (url, data, callback, type) {
    try {
        // Try using jQuery to get data
        jQuery.get(url, data, callback, type);
    } catch(e) {
        // jQuery get() failed, try IE8 CORS, or use the proxy
        if (jQuery.browser.msie && window.XDomainRequest) {
            // Use Microsoft XDR
            var xdr = new XDomainRequest();
            xdr.open("get", url);
            xdr.onload = function() {
                callback(this.responseText, 'success');
            };
            xdr.send();
        } else {
            try {
                // Ancient browser, use our proxy
                var mycallback = function() {
                    var textstatus = 'error';
                    var data = 'error';
                    if ((this.readyState == 4)
                        && (this.status == '200')) {
                        textstatus = 'success';
                        data = this.responseText;
                    }
                    callback(data, textstatus);
                };
                // proxy_xmlhttp is a separate script you'll have to set up
                request = new proxy_xmlhttp();
                request.open('GET', url, true);
                request.onreadystatechange = mycallback;
                request.send();
            } catch(e) {
                // Could not fetch using the proxy
            }
        }
    }
}

/**
 * This method is for Cross-site Origin Resource Sharing (CORS) POSTs
 *
 * @param string   url      the url to post to
 * @param mixed    data     additional data to send [optional]
 * @param function callback a function to call on success [optional]
 * @param string   type     the type of data to be returned [optional]
 */
$.oldPostCORS = function (url, data, callback, type) {
    try {
        // Try using jQuery to POST
        jQuery.post(url, data, callback, type);
    } catch(e) {
        // jQuery POST failed
        var params = '';
        for (key in data) {
            params = params+'&'+key+'='+data[key];
        }
        // Try XDR, or use the proxy
        if (jQuery.browser.msie && window.XDomainRequest) {
            // Use XDR
            var xdr = new XDomainRequest();
            xdr.open("post", url);
            xdr.send(params);
            xdr.onload = function() {
                callback(xdr.responseText, 'success');
            };
        } else {
            try {
                // Use the proxy to post the data.
                request = new proxy_xmlhttp();
                request.open('POST', url, true);
                request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                request.send(params);
            } catch(e) {
                // could not post using the proxy
            }
        }
    }
}
})(jQuery);
