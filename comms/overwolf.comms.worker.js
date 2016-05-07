/**
 * Created by trey on 5/7/16.
 */
windowToPort = self.windowToPort || {};
ports = self.ports || [];

function broadcast(data)
{
  for(var i in ports)
  {
    ports[i].postMessage({command:data.command, message:data.message});
  }
}

function emit(data,port)
{
  if(data.window_id)
  {
    var windowPort = windowToPort[data.window_id] || false;
    if(windowPort)
    {
      windowPort.postMessage({command:data.command, message:data.message});
    }
  }
  else
  {
    for(var i in ports)
    {
      if(ports[i].uuid!=port.uuid)
      {
        ports[i].postMessage({command:data.command, message:data.message});
      }
    }
  }
}

onconnect = function(e) { // addEventListener() is needed
  var port = e.ports[0];

  var uuid = Math.random().toString(36).substring(10);
  port.uuid = uuid;

  ports.push(port);

  port.onmessage = function(e) {

    var data = e.data;
    if(data.command=='closed')
    {
      delete windowToPort[port.window_id];
      ports.splice(ports.indexOf(port),1);
    }
    else if(data.command=='registerWindow')
    {
      if(data.window_id)
      {
        port.window_id = data.window_id;
        port.postMessage({command:'registered'});
        windowToPort[data.window_id] = port;
      }
    }
    else if(data.command=='getWindows')
    {
      var windowKeys = Object.keys(windowToPort);
      port.postMessage({command:'getWindows', message:windowKeys});
    }
    else if(data.command && data.message)
    {
      if(data.type=='emit')
      {
        emit(data, port);
      }
      else if(data.type=='broadcast')
      {
        broadcast(data);
      }
    }
  }
  port.start();  // not necessary since onmessage event handler is being used
};