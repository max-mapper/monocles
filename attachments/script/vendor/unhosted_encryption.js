// Generate a new random private key B bits long, using public expt E
function RSAGenerate(randomNumber) {
	var qs = 512>>1;
	this.e = parseInt("10001", 16);
	var ee = new BigInteger("10001", 16);
	for(;;) {
		for(;;) {
			p = new BigInteger(512-qs, 1, randomNumber);
			if(p.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && p.isProbablePrime(10)) break;
		}
		for(;;) {
			q = new BigInteger(qs, 1, randomNumber);
			if(q.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && q.isProbablePrime(10)) break;
		}
		if(p.compareTo(q) <= 0) {
			var t = p;
			p = q;
			q = t;
		}
		var p1 = p.subtract(BigInteger.ONE);
		var q1 = q.subtract(BigInteger.ONE);
		var phi = p1.multiply(q1);
		if(phi.gcd(ee).compareTo(BigInteger.ONE) == 0) {
			//generate some interesting numbers from p and q:
			var qs = 512>>1;		var e = parseInt("10001", 16);  var ee = new BigInteger("10001", 16);
			var p1 = p.subtract(BigInteger.ONE);	var q1 = q.subtract(BigInteger.ONE);
			var phi = p1.multiply(q1);	var n = p.multiply(q);	var d = ee.modInverse(phi);

			return {"n":n.toString(16), "d":d.toString(16)};
		}
	}
}

var createPub = function(nick, cloud, token, randomNumber) {
	var t = JSON.parse(token);
	key = RSAGenerate();
	key.c = cloud;
	key.r = t.r;
	key.w = t.w;
	var bnSeskey = new BigInteger(128,1,randomNumber); // rijndael function we use uses a 128-bit key
	key.s = bnSeskey.toString(16);
	return key;
}

var submitNS = function(key) {
	unhosted.importPub(key, "newKey");
	unhosted.rawSet("newKey", ".n", key.n, false);
	unhosted.rawSet("newKey", ".s", key.s, true);
}

var RSAEncrypt = function(text, pubkey) {//copied from the rsa.js script included in Tom Wu's jsbn library
	/*
  if((typeof keys[nick] === 'undefined') || (typeof keys[nick].n === 'undefined')) {
		alert("user "+nick+" doesn't look like a valid unhosted account");
	}
  */
	var n = new BigInteger();	n.fromString(pubkey, 16);
	var m = pkcs1pad2(text,(n.bitLength()+7)>>3);	if(m == null) return null;
	var c = m.modPowInt(parseInt("10001", 16), n);	if(c == null) return null;
	var h = c.toString(16);	
	if((h.length & 1) == 0) return h; else return "0" + h;
}

var RSADecrypt = function(ctext, pubkey, privkey) {//copied from rsa.js script included in Tom Wu's jsbn library
	var c = new BigInteger(ctext, 16);
	var n = new BigInteger();	n.fromString(pubkey, 16);
	var d = new BigInteger();	d.fromString(privkey, 16);
	var m = c.modPow(d, n);
	if(m == null) return null;
	return pkcs1unpad2(m, (n.bitLength()+7)>>3);
}