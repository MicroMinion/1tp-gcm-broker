var GCM = require("node-gcm-ccs");

var projectId = process.env.PROJECT_ID; 
var apiKey = process.env.API_KEY;

var gcm = new GCM(projectId, apiKey);

gcm.on('message', function(messageId, from, category, data) {
    console.log(messageId);
    console.log(from);
    console.log(category);
    console.log(data);
});

gcm.on('receipt', function(messageId, from, category, data) {
    console.log(messageId);
    console.log(from);
    console.log(category);
    console.log(data);
});

gcm.on('connected', function() {
    console.log("received connected event");
});

gcm.on("disconnected", function() {
    console.log("received disconnected event");
});

gcm.on("online", function() {
    console.log("received online event");
});

gcm.on("error", function() {
    console.log("received error event");
});
