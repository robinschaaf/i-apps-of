angular.module('i-apps-of.services', ['i-apps-of.utils'])

	.factory('AppsOfAPIService', function($http, $q, $state, $localstorage) {
	  var tasks = [];
      var url = 'http://apps-of.herokuapp.com/',
        mode = '.jsonp?callback=JSON_CALLBACK',
        key = '';    

		// We use promises to make this api asynchronous.
		return {
			getUserIndexData: function(userID) {
			  var deferred = $q.defer();
			  $http.jsonp(url + 'users/' + userID + mode + key)
			    .success(function(result, status, headers, config){
            		deferred.resolve(result);
            		$localstorage.setObject('user_tasks', result); //save this in local storage for later use
			    })
              	.error(function (data, status) {
                	deferred.reject(status)
              	});

				return deferred.promise;
			},
			getUserTask: function(taskID) {
			  var deferred = $q.defer();
			  	
			  $http.jsonp(url + 'user_tasks/' + taskID + mode + key)
			    .success(function(result, status, headers, config){
            		deferred.resolve(result);
            		$localstorage.setObject('user_task_' + taskID, result); //save this in local storage for later use
			    })
			    .error(function (data, status) {
                	deferred.reject(status)
              	});
			  return deferred.promise;
			},
			getSettings: function(userID) {
			  var deferred = $q.defer();
			  $http.jsonp(url + 'users/' + userID + '/settings' + mode + key)
			    .success(function(result, status, headers, config){
            		deferred.resolve(result);
            		$localstorage.setObject('settings', result); //save this in local storage for later use
			    })
			    .error(function (data, status) {
                	deferred.reject(status)
              	});
			  return deferred.promise;
			},
			registerUser: function(user) {
			  var deferred = $q.defer();

	          $http.post(url + 'api/user/register.json', JSON.stringify(user))
	              .success(function (data, status) {
	                deferred.resolve(data);
	              })
	              .error(function (data, status) {
	                console.log("Error registering user." + JSON.stringify(data) + " " + status)
	                $state.go('error');
	              });

			  return deferred.promise;
			},
			updateUser: function(user) {
			  var deferred = $q.defer();

	          $http.post(url + 'api/user/update.json', JSON.stringify(user))
	              .success(function (data, status) {
	                deferred.resolve(data);
	              }) 
	              .error(function (data, status) {
	                console.log("Error registering user." + JSON.stringify(data) + " " + status)
	              }
	          );
			  return deferred.promise;
			},
			updateUserCategory: function(user_categories) {
			  var deferred = $q.defer();

	          $http.post(url + 'api/user/categories.json', JSON.stringify(user_categories))
	              .success(function (data, status) {
	                deferred.resolve(data);
	              }) 
	              .error(function (data, status) {
	                console.log("Error registering user." + JSON.stringify(data) + " " + status)
	              }
	          );

			  return deferred.promise;
			},
			updateUserTask: function(user_task) {
			  var deferred = $q.defer();

	          $http.post(url + 'api/user/tasks.json', JSON.stringify(user_task))
	              .success(function (data, status) {
	                deferred.resolve(data);
	              }) 
	              .error(function (data, status) {
	                console.log("Error updating user." + JSON.stringify(data) + " " + status)
	              }
	          );

			  return deferred.promise;
			}
		}
	})

	.service('SplashScreenService', function( $cordovaSplashscreen ){
     	
    	this.hide = function() {
    		if (navigator.splashscreen) {
    			$cordovaSplashscreen.hide();
    		}
    	};

	});
