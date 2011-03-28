(function() {
  var ezcrypto = this.ezcrypto = {};
  
  // Basic/simple API
  ezcrypto.generateKey = function(password) {
    var RSAkeys = RSAGenerate(ezcrypto.randomNumber());
    var key = {'public': RSAkeys.n, 'private': RSAkeys.d};
    if (password) {
      key['encryptedPassword'] = ezcrypto.encryptRSA(password, key.public);
    }
    return key;
  }
  
  ezcrypto.encrypt = function(message, key) {
    var password = ezcrypto.getPassword(key);
    return ezcrypto.encryptAES(message, password)
  }
  
  ezcrypto.decrypt = function(message, key) {
    var password = ezcrypto.getPassword(key);
    return ezcrypto.decryptAES(message, password);
  }
  
  // Core encryption functions
  ezcrypto.encryptRSA = function(message, publicKey) {
    return RSAEncrypt(message, publicKey);
  }
  
  ezcrypto.decryptRSA = function(message, publicKey, privateKey) {
    return RSADecrypt(message, publicKey, privateKey);
  }
  
  ezcrypto.encryptAES = function(message, password){
    var aes = new pidCrypt.AES.CBC();
    var encryptedMessage = aes.encryptText(message, password, {nBits: 128});
    return encryptedMessage;
  }
  
  ezcrypto.decryptAES = function(message, password){
    var aes = new pidCrypt.AES.CBC();
    var plain = aes.decryptText(message, password, {nBits: 128});
    return plain;
  }
  
  // Utility functions
  ezcrypto.getPassword = function(key) {
    var password = key.public;
    if ("encryptedPassword" in key) password = ezcrypto.decryptRSA(key['encryptedPassword'], key.public, key.private);
    return password;
  }
  
  ezcrypto.randomNumber = function() {
    return new SecureRandom();
  }
  
  ezcrypto.loadScripts = function(scripts) {
    for (var i=0; i < scripts.length; i++) {
      document.write('<script src="'+scripts[i]+'"><\/script>')
    };
  };

  ezcrypto.loadScripts([
    "script/vendor/pidcrypt.js",
    "script/vendor/pidcrypt_util.js",
    "script/vendor/jsbn.js",
    "script/vendor/md5.js",
    "script/vendor/aes_core.js",
    "script/vendor/aes_cbc.js",
    "script/vendor/rng.js",
    "script/vendor/prng4.js",
    "script/vendor/rsa.js",
    "script/vendor/unhosted_encryption.js"
  ]);
  
})();