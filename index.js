#!/usr/bin/env node
require('dotenv').config()
EI_APIKEY = process.env.EI_APIKEY
EI_HMACKEY = process.env.EI_HMACKEY
EI_DEVICEID = process.env.EI_DEVICEID
EI_DEVICETYPE = process.env.EI_DEVICETYPE
SERIAL_PORT = process.env.SERIAL_PORT

if (!EI_APIKEY || !EI_HMACKEY || !EI_DEVICEID || !EI_DEVICETYPE || !SERIAL_PORT) {
    console.error('Configuration is incomplete. Please make sure the following environment variables are set: \n',
        '• EI_APIKEY: EdgeImpulse API key (ex. "ei_e48a5402eb9ebeca5f2806447218a8765196f31ca0df798a6aa393b7165fad5fe")\n',
        '• EI_HMACKEY: EdgeImpulse HMAC key (ex. "f9ef9527860b28630245d3ef2020bd2f")\n',
        '• EI_DEVICETYPE: EdgeImpulse Device Type (ex. "MXChip")\n',
        '• EI_DEVICEID: EdgeImpulse Device ID (ex. "mxchip001")\n',
        '• SERIAL_PORT: Serial port (ex: COM3, /dev/tty.usbmodem142303, …)\n')
    process.exit();
}

var cbor = require('cbor')

var WebSocketClient = require('websocket').client
var client = new WebSocketClient()

var uploadData = require('./uploadData')

const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')

const port = new SerialPort(SERIAL_PORT, {
    baudRate: 115200,
    autoOpen: true
})

var values = []
var capturing = false
var interval
var wsConnection
var lastDataPoint

const lineStream = port.pipe(new Readline())
lineStream.on('data', (d) => {
    if (capturing) {
        try {
            lastDataPoint = JSON.parse(d)
        } catch (error) {
            wsConnection.sendBytes(cbor.encode({
                sample: false,
                error: `Error while reading sensors: ${error}`
            }))
        }
    }
})

client.on('connectFailed', function (error) {
    console.log('Connect Error: ' + error.toString())
})

client.on('connect', function (connection) {
    wsConnection = connection
    console.log('WebSocket Client Connected')

    connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString())
    })

    connection.on('close', function () {
        console.log('Connection Closed')
        // Edge Impulse seems to close the connection after each upload, ... so let's reconnect :)
        client.connect('wss://remote-mgmt.edgeimpulse.com/')
    })

    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'")
        } else if (message.type == 'binary') {
            obj = cbor.decode(message.binaryData)
            if (obj.sample) {
                connection.sendBytes(cbor.encode({
                    sample: true
                }))
                values = []
                capturing = true
                interval = obj.sample.interval
                connection.sendBytes(cbor.encode({
                    sampleProcessing: true
                }))
                timer = setInterval(() => {
                    values.push(lastDataPoint)
                }, interval)

                setTimeout(() => {
                    clearInterval(timer)
                    capturing = false
                    connection.sendBytes(cbor.encode({
                        sampleUploading: true
                    }))
                    uploadData(obj.sample.path, EI_DEVICEID, EI_DEVICETYPE, EI_APIKEY, EI_HMACKEY, obj.sample.label, interval, values)
                    connection.sendBytes(cbor.encode({
                        sampleFinished: true
                    }))
                    values = []
                }, obj.sample.length)
            }
        }
    })

    function hello() {
        if (connection.connected) {
            var body = {
                "hello": {
                    "version": 2,
                    "apiKey": EI_APIKEY,
                    "deviceId": EI_DEVICEID,
                    "deviceType": EI_DEVICETYPE,
                    "connection": "ip",
                    "sensors": [{
                        "name": "Built-in accelerometers",
                        "maxSampleLengthS": 20000,
                        "frequencies": [10, 20, 50, 100]
                    }]
                }
            }

            connection.sendBytes(cbor.encode(body))
        }
    }
    hello()
})

client.connect('wss://remote-mgmt.edgeimpulse.com/')