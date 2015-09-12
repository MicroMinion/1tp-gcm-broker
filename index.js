var GCM = require("./node-gcm-ccs.js");
var uuid = require("node-uuid");

var projectId = process.env.PROJECT_ID; 
var apiKey = process.env.API_KEY;

var gcm = new GCM(projectId, apiKey);

var queue = {};

gcm.on('message', function(messageId, from, category, data) {
    console.log(data);
    if(data.type && data.type === "MESSAGE") {
        if(data.destination && data.data) {
            var id = uuid.v4();
            data.source = from;
            queue[messageId] = data;
            //setTimeout(function() {
            //    console.log("message delivery timed out");
            //    sendNotDelivered(from, data.destination, messageId);
            //}, 500);
            send(data.destination, messageId, data, true);
        } else {
            console.log("incorrect parameters");
            sendNotDelivered(from, data.destination, messageId);
        };
    } else {
        console.log("unrecognized data type");
        console.log(data);
    };
});

var send = function(destination, id, data, receipt) {
    var options = {};
    options.messageId = id;
    options.time_to_live = 0;
    options.delay_while_idle = false;
    options.delivery_receipt_requested = receipt;
    console.log("sending message");
    console.log(data);
    gcm.send(destination, data, options);
};

var sendNotDelivered = function(from, to, messageId) {
    if(!queue[messageId]) { return; };
    var data = {
        type: "MESSAGE_NOT_DELIVERED",
        destination: to,
        message_id: messageId
    };
    send(from, uuid.v4(), data, false);
    delete queue[messageId];
};

var sendDelivered = function(from, to, messageId) {
    if(!queue[messageId]) { return; };
    var data = {
        type: "MESSAGE_DELIVERED",
        destination: to,
        message_id: messageId
    };
    send(from, uuid.v4(), data, false);
    delete queue[messageId];
};

gcm.on('receipt', function(messageId, from, category, data) {
    console.log(messageId);
    console.log(data);
    var sender = queue[data.original_message_id].source;
    sendDelivered(sender, data.device_registration_id, data.original_message_id);
});

gcm.on('nack', function(messageId, error, description) {
    console.log("received nack");
    console.log(error);
    console.log(description);
    var from = queue[messageId].source;
    var to = queue[messageId].destination;
    sendNotDelivered(from, to, messageId);
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
