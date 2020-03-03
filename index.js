var cbor = require('cbor');

var WebSocketClient = require('websocket').client;
var client = new WebSocketClient();

var uploadData = require('./uploadData')

const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')

const port = new SerialPort('COM3', {
    baudRate: 115200,
    autoOpen: true
})

var values = []
var capturing = false
var interval
var wsConnection
var lastDataPoint;

DEVICEID = "MyMXChip"
DEVICETYPE = "MXCHIP"

// Pipe the data into another stream (like a parser or standard out)
const lineStream = port.pipe(new Readline())
lineStream.on('data', (d) => {
    if (capturing) {
        try {
            lastDataPoint = JSON.parse(d)
        } catch {
            wsConnection.sendBytes(cbor.encode({ sample: false, error: 'Error while reading sensors' }))
        }
    }
})

client.on('connectFailed', function (error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function (connection) {
    wsConnection = connection;
    console.log('WebSocket Client Connected');
    connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function () {
        console.log('Connection Closed');
        // Edge Impulse seems to close the connection after each upload, ... so let's reconnect :)
        client.connect('wss://remote-mgmt.edgeimpulse.com/');
    });
    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
        } else if (message.type == 'binary') {
            obj = cbor.decode(message.binaryData)
            if (obj.sample) {
                connection.sendBytes(cbor.encode({ sample: true }))
                values = [];
                capturing = true
                interval = obj.sample.interval
                connection.sendBytes(cbor.encode({ sampleProcessing: true }))
                timer = setInterval(() => {
                    values.push(lastDataPoint)
                }, interval);

                setTimeout(() => {
                    clearInterval(timer); capturing = false
                    connection.sendBytes(cbor.encode({ sampleUploading: true }))
                    uploadData(obj.sample.path, DEVICEID, DEVICETYPE, obj.sample.label, interval, values)
                    connection.sendBytes(cbor.encode({ sampleFinished: true }))
                    values = []
                }, obj.sample.length)
            }
        }
    });

    function hello() {
        if (connection.connected) {
            var body =
            {
                "hello": {
                    "version": 2,
                    "apiKey": "ei_e64396f029edd5060f1104b0cd00ca047c7ff575294e0fde67f0bfd04aa8cd75",
                    "deviceId": DEVICEID,
                    "deviceType": DEVICETYPE,
                    "connection": "ip",
                    "sensors": [
                        {
                            "name": "Built-in accelerometers",
                            "maxSampleLengthS": 20000,
                            "frequencies": [10, 20, 50, 100]
                        }
                    ]
                }
            }

            connection.sendBytes(cbor.encode(body))
        }
    }
    hello();
});

client.connect('wss://remote-mgmt.edgeimpulse.com/');
