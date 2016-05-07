/**
 * Created by trey on 5/7/16.
 * Trey Duffy
 * trey@womp.us
 * FUCK YOU. PLAY ME.
 *
 * Overwolf Shared Comms
 *
 * This plugin allows you to send messages
 * directly to another window in overwolf
 *
 *
 * --- Functions ---
 * $on
 *  params:
 *    @string   command
 *    @function callback
 *
 *
 * $broadcast
 *  params
 *    @string command
 *    @mixed  data
 *
 *
 * $emit
 *  params
 *    @string command
 *    @mixed  data
 *
 *
 * $to
 *  @string window_id
 *
 *  returns
 *    {
 *      $emit
 *    }
 *
 * $getWindows
 *  params
 *    @function callback
 *
 *  returns
 *    @array window_ids
 *
 *
 *
 * --- Examples ---
 *
 * register a listener:
 *
 * overwolf.windows.$on('eventName', function(data){
 *  console.log(data);
 * });
 *
 *
 * send a message to all open windows:
 * overwolf.windows.$broadcast('eventName,{some:'data'});
 *
 *
 * send a message to all windows except the one sending the message:
 * overwold.windows.$emit('eventName,{other:'data'});
 *
 *
 * send a message to a specific window:
 * overwolf.windows.obtainDeclaredWindow('TestWindow', function(result){
 *  if(result.status == 'success')
 *  {
 *    overwolf.windows.$to(result.window.id).$emit('eventName',{some:'data'});
 *  }
 * });
 *
 *
 * get a list of regitered window ids
 * overwolf.windows.$getWindows(function(window_ids){
 *  console.log(window_ids);
 * });
 */
(function (window, overwolf) {

  //Change this to the path of the worker
  var worker_path = "overwolf.comms.worker.js";


  var listeners = {};
  var window_id = null;
  var worker = null;
  var initiated = false;

  function sendMessage(type, command, message, to_window) {
    if (!worker) return;

    to_window = to_window || false;
    var msg = {
      type: type || null,
      window_id: to_window,
      command: command,
      message: message
    };
    worker.port.postMessage(msg);
  }

  function receiveMessage(e) {
    var data = e.data;
    data.message = data.message || null;

    if (data.command && listeners[data.command] != undefined) {
      if (typeof listeners[data.command] == 'Array') {
        for (var i in listeners[data.command]) {
          listeners[data.command][i](data.message)
        }
      }
      else {
        listeners[data.command](data.message)
      }
    }
  }

  function registerListener(command, callback) {
    if (listeners[command] == undefined) {
      listeners[command] = callback;
    }
    else {
      var otherListeners = listeners[command];
      if (typeof otherListeners == 'function') {
        listeners[command] = [otherListeners, callback];
      }
      else {
        listeners[command].push(callback);
      }
    }
  }

  function removeListener(command) {
    delete listeners[command];
  }

  function init() {
    overwolf.windows.getCurrentWindow(function (result) {
      if (result.status != 'success') return;

      window_id = result.window.id;
      worker = new SharedWorker(worker_path);
      worker.port.onmessage = receiveMessage;

      worker.port.start();


      setTimeout(function () {
        worker.port.postMessage({command: 'registerWindow', window_id: window_id});
      }, 50);

      addEventListener('beforeunload', function () {
        worker.port.postMessage({command: 'closed'});
      });
      initiated = true;
    });
  }


  function $on(command, callback) {
    callback = callback || function () {
    };
    registerListener(command, callback);
  }

  function $emit(command, message) {
    sendMessage('emit', command, message);
  }

  function $broadcast(command, message) {
    sendMessage('broadcast', command, message);
  }

  function $to(window_id) {
    return {
      $emit: function (command, message) {
        sendMessage('emit', command, message, window_id);
      }
    }
  }

  function $getWindows(callback) {
    callback = callback || function () {
    };

    registerListener('getWindows', function (data) {
      removeListener('getWindows');
      callback(data);
    });
    worker.port.postMessage({command: 'getWindows'});
  }

  //make sure Overwolf exists
  if (!overwolf) return;

  overwolf.windows.$getWindows = $getWindows;
  overwolf.windows.$broadcast = $broadcast;
  overwolf.windows.$emit = $emit;
  overwolf.windows.$on = $on;
  overwolf.windows.$to = $to;
  init();

}(window, window.overwolf || false))
