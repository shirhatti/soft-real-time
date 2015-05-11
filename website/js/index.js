var session = null;

var analog0 = null;
var analog1 = null;

var analog0_last = null;
var analog1_last = null;

var line0 = new TimeSeries();
var line1 = new TimeSeries();

var eventCnt = 0;
var eventCntUpdateInterval = 2;

function onAnalogValue(args) {
  eventCnt += 1;
  var payload = args[0];
  payload.value = payload.value / 400 * 100;
  payload.value = payload.value.toFixed(2);
  switch (payload.id) {
     case 0:
        analog0.innerHTML = payload.value;
        if (analog0_last !== null) {
           line0.append(new Date().getTime(), analog0_last);
        }
        analog0_last = payload.value;
        line0.append(new Date().getTime(), payload.value);
        break;
     case 1:
        analog1.innerHTML = payload.value;
        if (analog1_last !== null) {
           line1.append(new Date().getTime(), analog1_last);
        }
        analog1_last = payload.value;
        line1.append(new Date().getTime(), payload.value);
        break;
     default:
        break;
  }
}

function controlLed(turnOn) {
  session.call("com.myapp.mcu.control_led", [turnOn]);
}

function updateEventCnt() {
  document.getElementById("event-cnt").innerHTML = Math.round(eventCnt/eventCntUpdateInterval) + " events/s";
  eventCnt = 0;
}

window.onload = function ()
{
  analog0 = document.getElementById('analog0');
  analog1 = document.getElementById('analog1');

  var smoothie = new SmoothieChart({grid: {strokeStyle: 'rgb(125, 0, 0)',
                                           fillStyle: 'rgb(60, 0, 0)',
                                           lineWidth: 1,
                                           millisPerLine: 250,
                                           verticalSections: 6},
                                    minValue: 0,
                                    maxValue: 100,
                                    resetBounds: false,
                                    //interpolation: "line"
                                    });

  smoothie.addTimeSeries(line0, { strokeStyle: 'rgb(0, 255, 0)', fillStyle: 'rgba(0, 255, 0, 0.4)', lineWidth: 3 });
  smoothie.addTimeSeries(line1, { strokeStyle: 'rgb(255, 0, 255)', fillStyle: 'rgba(255, 0, 255, 0.3)', lineWidth: 3 });

  smoothie.streamTo(document.getElementById("mycanvas"));


  // the URL of the WAMP Router (e.g. Crossbar.io)
  //
  var wsuri = 'ws://beta.shirhatti.com:8080/ws';
  
  // connect to WAMP server
  //
  var connection = new autobahn.Connection({
     url: wsuri,
     realm: 'realm1'
  });

  connection.onopen = function (new_session) {
     console.log("connected to " + wsuri);

     session = new_session;

     session.subscribe("com.myapp.mcu.on_analog_value", onAnalogValue);

     eventCnt = 0;

     window.setInterval(updateEventCnt, eventCntUpdateInterval * 1000);
  };

  connection.open();
};