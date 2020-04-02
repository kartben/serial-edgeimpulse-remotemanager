# Welcome to serial-edgeimpulse-remotemanager 👋
![Version](https://img.shields.io/badge/version-0.1.0-blue.svg?cacheSeconds=2592000)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://github.com/kartben/mxchip-edgeimpulse-remotemanager)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)
[![Twitter: kartben](https://img.shields.io/twitter/follow/kartben.svg?style=social)](https://twitter.com/kartben)

> An implementation of the EdgeImpulse remote management protocol for capturing sensor data dumped on a serial port as [JSON lines](http://jsonlines.org/).

## Install

```sh
npm install serial-edgeimpulse-remotemanager -g
```

## Usage

The remote manager needs to be configured using the following environment variables:

* `EI_APIKEY`: EdgeImpulse API key (ex. ei_e48a5402eb9ebeca5f2806447218a8765196f31ca0df798a6aa393b7165fad5fe') for your project ;
* `EI_HMACKEY`: EdgeImpulse HMAC key (ex. 'f9ef9527860b28630245d3ef2020bd2f') for your project ;
* `EI_DEVICETYPE`: EdgeImpulse Device Type (ex. 'MXChip') ;
* `EI_DEVICEID`: EdgeImpulse Device ID (ex. 'mxchip001') ;
* `SERIAL_PORT`: Serial port (ex: 'COM3', '/dev/tty.usbmodem142303', …).

Once properly configured (i.e. variables defined in your environment or in a `.env` file in the folder from where you'll run the tool), simply launch the serial bridge:

```sh
serial-edgeimpulse-remotemanager
```

## Author

👤 **Benjamin Cabé**

* Website: http://blog.benjamin-cabe.com
* Twitter: [@kartben](https://twitter.com/kartben)
* Github: [@kartben](https://github.com/kartben)
* LinkedIn: [@benjamincabe](https://linkedin.com/in/benjamincabe)

## Show your support

Give a ⭐️ if this project helped you!


***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_