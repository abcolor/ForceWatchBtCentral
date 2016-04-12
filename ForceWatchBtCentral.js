var winston = require('winston');
var noble = require('noble');

var serviceUUID = '7e58'
var characteristicControlAppUUID = 'b81e'
var characteristicGetAppNameUUID = 'b82e'

var events = require('events');
var eventEmitter = new events.EventEmitter();

//winston.level = 'debug';

var currentApp = '';

exports.startPeripheralScan = function() {
	noble.once('stateChange', function(state) {
		if (state === 'poweredOn') {
			//noble.startScanning();
			noble.startScanning([serviceUUID], true);			
			winston.log('info', 'bt server start scan');
		}
		else {
			noble.stopScanning();
			winston.log('info', 'bt server stop scan');
		}
	});	
};


exports.on = function(event, handler) {	
	eventEmitter.on(event, handler);
}

exports.setCurrentAppName = function(appName) {
	currentApp = appName
};


noble.on('discover', function(peripheral) {

	winston.log('debug', 'on -> discover: ' + peripheral);
	noble.stopScanning();

  	peripheral.once('connect', function() {
    	winston.log('debug', 'on -> connect');
    	
    	this.discoverServices();
    	
    	eventEmitter.emit('connect');
  	});

  	peripheral.once('disconnect', function() {
    	winston.log('debug', 'on -> disconnect');

    	eventEmitter.emit('disconnect');

    	console.log('reconnecting...');
  		noble.stopScanning();
		noble.startScanning([serviceUUID], true);			
  	});

  	peripheral.once('rssiUpdate', function(rssi) {    	
    	winston.log('debug', 'on -> RSSI update ' + rssi);
    	
  	});

  	peripheral.once('servicesDiscover', function(services) {

  		winston.log('debug', 'on -> peripheral services discovered ' + services);    	
    	
    	services.forEach(function(service, index, services) {		        		
		    //console.log('     service UUID ' + service.uuid);

		    if(service.uuid === serviceUUID) {
				
				winston.log('debug', 'found ForceWatch service');

		    	service.once('includedServicesDiscover', function(includedServiceUuids) {		      		
		      		winston.log('debug', 'on -> service included services discovered ' + includedServiceUuids);
		      		this.discoverCharacteristics();
		    	});

		    	service.once('characteristicsDiscover', function(characteristics) {

		    		winston.log('debug', 'on -> service characteristics discovered ' + characteristics);		      		

		      		characteristics.forEach(function(characteristic, index, characteristics) {
						//console.log('     characteristic UUID ' + characteristic.uuid);

						//  characteristicControlApp...
						if(characteristic.uuid === characteristicControlAppUUID) {

							winston.log('debug', 'start to use characteristicControlApp');																				
							
							characteristic.on('read', function(data, isNotification) {
								winston.log('debug', 'on -> characteristic [' + characteristic.uuid + '] read ' + data.toString('utf-8') + ' ' + isNotification);
				        		eventEmitter.emit('data', data);				        					        		
				      		});

				      		characteristic.on('notify', function(state) {
				      			winston.log('debug', 'on -> characteristic notify ' + state);				        						        		
				      		});

				      		characteristic.notify(true);				      		
						}


						//  characteristicGetAppName...
						if(characteristic.uuid === characteristicGetAppNameUUID) {

							winston.log('debug', 'start to listen characteristicGetAppName');
																											
							characteristic.on('read', function(data, isNotification) {
								winston.log('debug', 'on -> characteristic [' + characteristic.uuid + '] read ' + data.toString('utf-8') + ' ' + isNotification);
				        		
				        		characteristic.write(new Buffer(currentApp));				        		
				      		});

				      		characteristic.on('write', function() {				        				        		
				        		winston.log('debug', 'on -> characteristic write');
				      		});

				      		characteristic.on('notify', function(state) {
				      			winston.log('debug', 'on -> characteristic notify ' + state);				        						        		
				      		});
				      		
				      		characteristic.notify(true);				      		
						}

		      		});
		      		
		    	});

				service.discoverIncludedServices();
		    }
		});
  });

  peripheral.connect();	
});
