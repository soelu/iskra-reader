'use strict';
var serialport = require('serialport');
// var SerialPort = serialport.SerialPort;
var parsers = serialport.parsers;
const fs = require('fs');


var port = new serialport('/dev/ttyUSB0', {
	baudRate: 300,
	dataBits: 7,
	stopBits: 1,
	parity: 'even',
	parser: parsers.readline('\r\n')
});

port.on('open', function() {
	console.log('Port open');
	init();
});

port.on('data', function(data) {
	console.log('Line from file:', data);
  var d = data;
	if (d.lastIndexOf('/ISk5MT174', 0) === 0) {
		d = '\n' + new Date().getTime() + ';' + d;
	} else {
		d = ';' + d;
	}
	fs.appendFile('data.csv', d, function (err) {
	  	if (err) return console.log(err);
	});
});

function init() {
	port.write('/?!\r\n');
	setInterval(port.write('/?!\r\n'), 5*60*1000);
}
