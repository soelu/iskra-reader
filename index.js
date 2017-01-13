'use strict';
var serialport = require('serialport');
// var SerialPort = serialport.SerialPort;
var parsers = serialport.parsers;

var port = new serialport('/dev/tty.usbserial-141', {
  baudRate: 300,
  dataBits: 7,
  stopBits: 1,
  parity: 'even',
  parser: parsers.readline('\r\n')
});

port.on('open', function() {
  console.log('Port open');
  port.write('/?!\n');
});

port.on('data', function(data) {
  console.log(data);
});

