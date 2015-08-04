var curve = require("curve-protocol");

var keypair = curve.generateKeypair();

console.log(curve.toBase64(keypair.publicKey));
console.log(curve.toBase64(keypair.secretKey));
