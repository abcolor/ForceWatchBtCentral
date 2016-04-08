
var btService = require("./ForceWatchBtCentral.js");

btService.startPeripheralScan();

btService.on('connect', function(){
	console.log('ForceWatch is connected');
});

btService.on('disconnect', function(){
	console.log('ForceWatch is disconnected');
});

// retrieve control command
btService.on('data', function(data){
	console.log('ForceWatch data: ' + data.toString('utf-8'));
});

// set current app/ website name
btService.setCurrentAppName('youtube');