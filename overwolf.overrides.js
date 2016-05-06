/**
 * Created by trey on 5/6/16.
 * Trey Duffy
 * trey@womp.us
 * FUCK YOU. PLAY ME.
 *
 * Overwolf Promise API Interceptor
 *
 *
 * Use Examples:

  Single Call:

  overwolf.windows.obtainDeclaredWindow("Challenge")
    .then(function(result){
      console.log(result.window.id,'Window ID');
    });

  Call Using Result:

  overwolf.windows.obtainDeclaredWindow("Challenge")
    .then(function(result){
      overwolf.windows.close(result.window.id);
    });

  Chained Calls:

  overwolf.windows.getCurrentWindow()
    .then(function(result){
      return overwolf.windows.setTopmost(result.window.id, true);
    })
    .then(function(result){
      console.log('current window is now set to top')
    })
    .catch(function(err){
      console.log('there was an error setting window to top');
    })
 */
(function(window, overwolf){
  /*
    You can add overrides here just make sure they
    conform to the standards listed in the overrideCallback
    function below
   */
  var overrides = {
    windows : [
      'getCurrentWindow','obtainDeclaredWindow','changeSize',
      'changePosition','close','minimize','maximize','restore',
      'getWindowState','getWindowsStates','openOptionsPage',
      'setDesktopOnly','setTopmost','sendToBack']
  }


  /**
   * Override an Overwolf function to use the promise API
   * this assumes two things
   * 1) The callback is the last argument
   * 2) The response format includes status with success to pass
   *
   * @param f
   * @returns {Function}
   */
  function overrideCallback(f)
  {
    //Store the old function
    var oldFunction = f;
    var _this = this;

    return function(){

      //put all of the arguments into an array
      var args = Array.prototype.slice.call(arguments);

      //check to see if a callback has been passed
      //and make the call directly to support original functionality
      if(args.length>0 && typeof args[args.length-1]=='function')
      {
        return oldFunction.apply(_this,args);
      }

      //if there's no callback, add the promise interceptor
      var P = new Promise(function(resolve,reject){

        /**
         * Override for the original callback
         * assumes result && result.status
         * @param result
         */
        var newCallback = function(result)
        {
          if(result && result.status=='success')
          {
            resolve(result);
          }
          else
          {
            reject(result);
          }
        }

        //callback is always at the end
        args.push(newCallback);
        try
        {
          oldFunction.apply(_this,args);
        }
        catch(e){
          reject(e);
        }
      });
      return P;
    }
  }

  //make sure Overwolf exists
  if(!overwolf) return;

  //get the keys we want to apply to
  var props = Object.keys(overrides);
  for(var prop in props)
  {
    var p = props[prop];
    for(var i in overrides[p])
    {
      var k = overrides[p][i];
      overwolf[p][k] = new overrideCallback(overwolf[p][k]);
    }
  }
}(window,window.overwolf||false))
