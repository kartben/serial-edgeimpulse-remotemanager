const fs = require('fs')
const crypto = require('crypto')
const request = require('request')
const cbor = require('cbor')

function uploadData(path, deviceName, deviceType, apiKey, hmacKey, fileName, interval, values) {
  // empty signature (all zeros). HS256 gives 32 byte signature, and we encode in hex, so we need 64 characters here
  let emptySignature = Array(64).fill('0').join('')

  let data = {
    protected: {
      ver: "v1",
      alg: "HS256",
      iat: Math.floor(Date.now() / 1000) // epoch time, seconds since 1970
    },
    signature: emptySignature,
    payload: {
      device_name: deviceName,
      device_type: deviceType,
      interval_ms: interval,
      sensors: [
        { name: "accX", units: "m/s2" },
        { name: "accY", units: "m/s2" },
        { name: "accZ", units: "m/s2" },
        { name: "gyrX", units: "deg/s" },
        { name: "gyrY", units: "deg/s" },
        { name: "gyrZ", units: "deg/s" }
      ],
      values: values
    }
  }

  let encoded = JSON.stringify(data)

  // now calculate the HMAC and fill in the signature
  let hmac = crypto.createHmac('sha256', hmacKey)
  hmac.update(encoded)
  let signature = hmac.digest().toString('hex')

  // update the signature in the message and re-encode
  data.signature = signature
  encoded = cbor.encode(data)

  // now upload the buffer to Edge Impulse
  var headers = {
    'x-api-key': apiKey,
    'x-file-name': fileName,
    'Content-Type': 'application/cbor'
  }

  console.log('Sending data to Edge Impulse')
  console.log('----------------------------')
  console.log('Path: ', 'https://ingestion.edgeimpulse.com' + path)
  console.log('Headers:', headers)
  console.log('Body:', data)

  request.post('https://ingestion.edgeimpulse.com' + path, {
    headers: headers,
    body: encoded,
    encoding: 'binary'
  }, function (err, response, body) {
    if (err) return console.error('Request failed', err)

    console.log('Uploaded file to Edge Impulse', response.statusCode, body)
  })
}

module.exports = uploadData