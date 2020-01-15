'use strict';
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const fs = require('fs');
const request = require('request');
const config =  require('./config.json');
var dataBuffer = JSON.parse(fs.readFileSync('./' + config.bufferFileName));
var lastDataTime = 0;

const port = new SerialPort('/dev/ttyUSB0', {
	baudRate: 300,
	dataBits: 7,
	stopBits: 1,
	parity: 'even',
});

const parser = port.pipe(new Readline({ delimiter: '\r\n' }));

// Open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message)
})

port.on('open', function() {
	console.log('Port open');
	init();
});

parser.on('data', function(line) {
	if (line.lastIndexOf('1-0:1.8.0*255') >= 0) {
		var timestamp = new Date().getTime();
		lastDataTime = timestamp;
		var energy = line.match(/\(([^)]+)\*kWh\)/)[1];
		console.log(timestamp, energy);
		fs.appendFile('data.csv', timestamp+';'+energy+'\n', function (err) {
		  	if (err) return console.log(err);
		});

		var data = config.influxdb.measurement + ',obis=1.8.0*255 workIn=' + energy + ' ' + timestamp*1000000;

		sendToInflux(data, true);
	}
	if (line.lastIndexOf('!') == 0) {
		console.log('got termitating string. getting next data in 10s');
		setTimeout(getData, 10000);
	}
});

function init() {
	getData();
	setInterval(getDataSafety, 5*60*1000);
	setInterval(resend, 30*60*1000);
	setInterval(writeOutBuffer, 15*60*1000);
}

function getDataSafety() {
	var now = new Date().getTime();
	if (lastDataTime + 10*60*1000 <= now) {
		console.warn('lastDataTime to old. Triggering new data.', lastDataTime);
		getData();
	}
}

function getData() {
	port.write('/?!\r\n');
}

function sendToInflux(data, doBuffer, callback) {
	request.post({
		headers: {'content-type' : 'text/plain'},
		url:     config.influxdb.writeUrl,
		body:    data },
		function(error,response,body) {
		if (error || response.statusCode >= 400) {
			console.warn('Error writing data to influxdb!');
			if (doBuffer) {
				console.warn('Buffering data...');
				dataBuffer.push(data);
			}
			if (callback) callback("Error");
		} else {
			console.log('Data written to influxdb');
			if (callback) callback();
		}

	})
}

function resend() {
	console.log('Resending failed data from buffer.');
	console.log('Retrying', dataBuffer.length, 'data entries.');
	for (var i = dataBuffer.length - 1; i >= 0; i--) {
		var bufferLine = dataBuffer[i];
		sendToInflux(bufferLine, false, function(err) {
			if (err) {
				console.log('resend failed');
			} else {
				dataBuffer.splice(dataBuffer.indexOf(bufferLine), 1);
			}
		});

	}
};

function writeOutBuffer() {
	console.log('writing out');
	fs.writeFile(config.bufferFileName, JSON.stringify(dataBuffer), function(err) {
		if (err) {
    		console.log(err);
    	}
	});
}
