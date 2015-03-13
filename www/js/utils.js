angular.module('i-apps-of.utils', ['i-apps-of.services'])

  .factory('$localstorage', ['$window', function($window) {
    return {
      set: function(key, value) {
        $window.localStorage[key] = value;
      },
      get: function(key, defaultValue) {
        return $window.localStorage[key] || '1';
      },
      setObject: function(key, value) {
        $window.localStorage[key] = JSON.stringify(value);
      },
      getObject: function(key) {
        return JSON.parse($window.localStorage[key] || '{}');
      }
    }

  }])

  // Race condition found when trying to use $ionicPlatform.ready in app.js and calling register to display id in AppCtrl.
  // Implementing it here as a factory with promises to ensure register function is called before trying to display the id.
  .factory(("ionPlatform"), function( $q ){
      var ready = $q.defer();

      ionic.Platform.ready(function( device ){
          ready.resolve( device );
      });

      return {
          ready: ready.promise
      }
  })

  .factory('UserService', function( $ionicPlatform, ionPlatform, $localstorage, $q, AppsOfAPIService ) {
    var config = {};
    var d_userID = $q.defer();
    var pushNotification;
    var updated=false;

    var register = function() {
      var deferred = $q.defer();  //use deferred promises...

      if (ionic.Platform.isIOS()) {  // only ios for now - will need to return to devgirl project to get for android
        config = {
          "badge": "true",
          "sound": "true",
          "alert": "true",
          "ecb": "window.onNotification"
        }

        function successHandler (result) {
            deferred.resolve(result)
        }

        function errorHandler (result) {
            deferred.resolve('')
        }

        try{
          pushNotification = window.plugins.pushNotification;
          pushNotification.register(successHandler, errorHandler, config)
        }catch(err){
          deferred.resolve("")
        }

        return deferred.promise
      }
    }

    // type = Platform type (ios, android etc)
    //this is a convenience method, just to make sure we have the latest token.  it's not required
    var updateDeviceToken = function(platform, uid, regId) {

      var user = { "user": { id: uid, platform_type: platform, token: regId } }  

      AppsOfAPIService.updateUser(user).then(function(response) {
        updated=true;
      });  
        
    }


    var storeDeviceToken = function(platform, regId) {

      //use deferred promises...we need this to work
      var deferred = $q.defer();

      // default user to 8:00 pm GMT
      var user = { "user": { send_time: '20:00:00', platform_type: platform, token: regId } };

      AppsOfAPIService.registerUser(user).then(function(data) {
          $localstorage.set('user_id', data.user.id);  //set local device storage for later
          deferred.resolve(data);
      }); 

      return deferred.promise

    }


    return {
      getUserID: function() {
        var uid = $localstorage.get('user_id');

        if (!ionic.Platform.isIOS()){ //if this is coming from a browser, there's no localstorage, and default to user id 1
          d_userID.resolve("1");
        }else{
          //get the most up to date platform version
          var platform = "ios" + ionic.Platform.version()

          if (uid > 1){
            //ok to resolve this promise now, the further code is to verify the correct token is still stored, but this doesn't change much (ever?)
            d_userID.resolve(uid);
            
            ionPlatform.ready.then(function (device) {
              register().then(function(regID) {
                if (!updated){
                  updateDeviceToken(platform, uid, regID);  
                }
              });
            });

          }else{
            //start registration process - lots of chained promises
            ionPlatform.ready.then(function (device) {  //waiting for ionplatform ready promise
              register().then(function(regID) {  //wait for cordova push registration promise
                storeDeviceToken(platform, regID).then(function(data) {  //wait for storing/getting user from server
                    d_userID.resolve(data.user.id);
                });
              });
            });
          }
        } 
        return d_userID.promise
      }
    }

    // Unregister - Unregister your device token from APNS or GCM
    //this is actually handled in the setting page
    function unregisterDevice() {
        //console.log("Unregister called");
    }

  })

  //this is just used for displaying quotes, since the first letter of the quote is a big one
  .filter('removeFirstLetter', function () {
        return function (text) {
            if (text.length > 1) {
                return String(text).substring(1, text.length);
            }

        };
  })
