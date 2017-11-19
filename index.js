var GCM = require('node-gcm-ccs')
var uuid = require('node-uuid')

var projectId = process.env.PROJECT_ID
var apiKey = process.env.API_KEY

var gcm = new GCM(projectId, apiKey)

var queue = {}

gcm.on('message', function (messageId, from, category, data) {
  console.log(data)
  if (data.type && data.type === 'MESSAGE') {
    if (data.destination && data.data) {
      data.source = from
      send(data.destination, uuid.v4(), data, false)
    } else {
      console.log('incorrect parameters')
    }
  } else {
    console.log('unrecognized data type')
    console.log(data)
  }
})

var send = function (destination, id, data, receipt) {
  var options = {}
  options.messageId = id
  options.time_to_live = 0
  options.delay_while_idle = false
  options.delivery_receipt_requested = receipt
  console.log('sending message')
  console.log(data)
  gcm.send(destination, data, options)
}

gcm.on('connected', function () {
  console.log('received connected event')
})

gcm.on('disconnected', function () {
  console.log('received disconnected event')
  gcm.connect()
})

gcm.on('error', function (error) {
  console.log('received error event')
  console.log(error)
})

gcm.on('message-error', function (message) {
  console.log('received message error event')
  console.log(message)
})
