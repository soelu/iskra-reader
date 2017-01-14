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

port.on('data', function(line) {
	var d = '';
	if (line.lastIndexOf('/ISk5MT174') >= 0) {
		d = '\n' + new Date().getTime() + ';';
	} else {
		if (line.lastIndexOf('1-0:1.8.0*255') >= 0) {
			d = line.match(/\(([^)]+)\)/)[1];
		}
	}
	console.log(d);
	fs.appendFile('data.csv', d, function (err) {
	  	if (err) return console.log(err);
	});
});

function init() {
	getData();
	setInterval(getData, 5*60*1000);
}

function getData() {
	port.write('/?!\r\n');
}
