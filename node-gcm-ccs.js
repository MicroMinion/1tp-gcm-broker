"use strict";

var xmpp = require('node-xmpp-client');
var ltx = require("ltx");
var EventEmitter = require('events').EventEmitter;
var inherits = require("inherits");
var crypto = require('crypto');

var GCMClient = function(projectId, apiKey) {
    this.draining = false;
    this.queued = [];
    this.client = new xmpp.Client({
        type: 'client',
        jid: projectId + '@gcm.googleapis.com',
        password: apiKey,
        port: 5235,
        host: 'gcm.googleapis.com',
        legacySSL: true,
        preferredSaslMechanism: 'PLAIN'
    });
    this.client.connection.socket.setTimeout(0);
    this.client.connection.socket.setKeepAlive(true, 10000);
    var gcm = this;
    this.client.on('online', function() {
        gcm.emit('connected');

        if (gcm.draining) {
            gcm.draining = false;
            var i = gcm.queued.length;
            while (--i) {
                gcm._send(gcm.queued[i]);
            }
            gcm.queued = [];
        }
    });

    this.client.on('close', function() {
        if (gcm.draining) {
            gcm.client.connect();
        } else {
            gcm.emit('disconnected');
        }
    });

    this.client.on('error', function(e) {
        gcm.emit('error', e);
    });

    this.client.on('stanza', function(stanza) {
        if (stanza.is('message') && stanza.attrs.type !== 'error') {
            var data = JSON.parse(stanza.getChildText('gcm'));
            if (!data || !data.message_id) {
                return;
            }

            switch (data.message_type) {
                case 'control':
                    if (data.control_type === 'CONNECTION_DRAINING') {
                        gcm.draining = true;
                    }
                    break;

                case 'nack':
                    gcm.emit('nack', data.message_id, data.error, data.error_description);
                    break;

                case 'ack':
                    gcm.emit('ack', data.message_id);
                    break;

                case 'receipt':
                    gcm.emit('receipt', data.message_id, data.from, data.category, data.data);
                    break;

                default:
                    // Send ack, as per spec
                    if (data.from) {
                        gcm._send({
                            to: data.from,
                            message_id: data.message_id,
                            message_type: 'ack'
                        });

                        if (data.data) {
                            gcm.emit('message', data.message_id, data.from, data.category, data.data);
                        }
                    }

                    break;
            }
        } else {
            console.log(JSON.stringify(stanza));
            var message = stanza.getChild('error').getChildText('text');
            gcm.emit('message-error', message);
        }
    });
};

inherits(GCMClient, EventEmitter);

GCMClient.prototype._send = function(json) {
    if (this.draining) {
        this.queued.push(json);
    } else {
        var message = new ltx.Element('message').c('gcm', {
            xmlns: 'google:mobile:data'
        }).t(JSON.stringify(json));
        this.client.send(message);
    }
};


GCMClient.prototype.connect = function() {
    this.client.connect();   
};

GCMClient.prototype.send = function(to, data, options) {
    var messageId;
    if(options.messageId) {
        messageId = options.messageId;
        delete options.messageId;
    } else {
        messageId = crypto.randomBytes(8).toString('hex');
    };

    var outData = {
        to: to,
        message_id: messageId,
        data: data
    };
    Object.keys(options).forEach(function(option) {
        outData[option] = options[option];
    });
    this._send(outData);
};

GCMClient.prototype.end = function() {
    this.client.end();
};

module.exports = GCMClient;
