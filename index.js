var GCM = require("./node-gcm-ccs.js");
var curve = require("curve-protocol");
var uuid = require("node-uuid");

var projectId = process.env.PROJECT_ID; 
var serverKey = process.env.GCM_SECRET_KEY;
var apiKey = process.env.API_KEY;

var gcm = new GCM(projectId, apiKey);

//directory mapping publicKey => registrationId for clients
var directory = {};

gcm.on('message', function(messageId, from, category, data) {
    //console.log(messageId);
    //console.log(from);
    //console.log(category);
    //console.log(data);
    if(data.type === "register") {
        var boxResult = curve.verify(data.signature, messageId, data.publicKey, serverKey);
        if(boxResult === from) {
            directory[data.publicKey] = from;
            sendRegistrationOk(from);
        } else {
            sendRegistrationFailed(from);
        };
    } else if(data.type === "message") {

    };
});

var sendRegistrationOk = function(destination) {
    console.log("sending registration ok");
    var options = {};
    options.messageId = uuid.v4();
    options.time_to_live = 0;
    options.delay_while_idle = false;
    options.delivery_receipt_requested = true;
    gcm.send(destination, {type: "registrationOK"}, options) 
};

var sendRegistrationFailed = function(destination) {
    console.log("sending registration failed");
};

gcm.on('receipt', function(messageId, from, category, data) {
    //console.log(messageId);
    //console.log(from);
    //console.log(category);
    //console.log(data);
});


gcm.on('connected', function() {
    console.log("received connected event");
});

gcm.on("disconnected", function() {
    console.log("received disconnected event");
    gcm.connect();
});


gcm.on("error", function(error) {
    console.log("received error event");
    console.log(error);
});

gcm.on('message-error', function(message) {
    console.log("received message error event");
    console.log(message);
});
