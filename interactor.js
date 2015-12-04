// simple application to listen to Interactor Websocket Events

// get API key from cmd line
var apikey = process.argv[2];
if (!apikey)
  process.exit();

// get event type from cmd line
// support event types are BEACON, BEACON_STATUS and ZONE
var eventCmd = process.argv[3];
if (!eventCmd)
  process.exit();


// define some variables
var messageTxt = '';
var messageID = 1;
var responseID = 1;
var cmd = 'AUTH:';
var intervalID =  0;

// create Websocket
var WebSocket = require('ws');
var ws = new WebSocket('wss://interactor.swisscom.ch/api/events/stream/websocket');

// log ws erros
ws.on('error', function (err) {
  console.log(err);
});

// open websocket connection
ws.on('open', function open() {
  console.log('connected');

  // prepare AUTH message
  messageTxt = cmd+messageID+' '+apikey;
  console.log(messageTxt);
  ws.send(messageTxt);
});

ws.on('close', function close() {
  console.log('disconnected');
});

// call on received websocket messsages
ws.on('message', function message(data, flags) {
  
  // switch on last command sent
  switch (cmd) {
    
    // AUTH sent
    case 'AUTH:': 
      // split return message on colon
      ret = data.split(':');
      
      // check if return OK and message ID in correct order
      if (ret[0] == 'OK' && ret[1] == messageID) {
        //increase message ID for next cmd call
        messageID++;
      }
      else {
        console.log('Error: '+data); 
        break;
      }
      
      // set next cmd to SUB
      cmd = 'SUB:';
      
      // build SUB message
      messageTxt = cmd+messageID+' '+eventCmd; 
      console.log(messageTxt);
      ws.send(messageTxt);
      break;
    
    // SUB sent
    case 'SUB:':
      // split return message on colon
      ret = data.split(':');

      // check if return OK and message ID in correct order
      if (ret[0] == 'OK' && ret[1] == messageID) {
        //console.log(ret);
        messageID++;
      }
      else {
        console.log('Error: '+data); 
        break;
      }
      
      // set next cmd to DATA
      // (we don't send a DATA cmd - we just use it as a switch)
      cmd = 'DATA';

      // set interval and send ping to avoid disconnect after 60sec
      intervalID = setInterval(function (){
        console.log('Ping');
        ws.ping();
        }, 50000);

      break;   

    // in DATA receive mode
    case 'DATA':
      // clear ping interval trigger
      clearInterval(intervalID);
      
      // get data payload - weired format...
      ret = data.split('\n\n');
      
      // log payload
      console.log(ret[1]);

      // set interval and send ping to avoid disconnect after 60sec
      intervalID = setInterval(function (){
        console.log('Ping');
        ws.ping();
        }, 50000);
      break;
    }
});
