var app = angular.module('i-apps-of.controllers', [])

	.controller('IndexCtrl', ['$scope', '$rootScope', 'getUser', '$timeout', '$ionicScrollDelegate', '$localstorage', 'AppsOfAPIService', function($scope, $rootScope, getUser, $timeout, $ionicScrollDelegate, $localstorage, AppsOfAPIService){

		$scope.userID = getUser;
		$scope.top_card = true;
		passTasksToScope($localstorage.getObject('user_tasks'));

		//wait just a bit to start showing these, otherwise easily missed
		$scope.completed_array = new Array();

		//to get around user tasks being a promise, since locally stored objects are available immediately
		function passTasksToScope(results) {
			$scope.user_tasks = results.tasks;
			$scope.complete_count = results.complete_count;

			if (results.message){
				$scope.message = { showMessage: true, messageText: results.message };
			}else{
				$scope.message = { showMessage: false, messageText: '' };
			}

		    $scope.completed_array = Array.apply(null, Array(results.complete_count));
    		$scope.completed_array = $scope.completed_array.map(function (x, i) { return i });			
		}

		var getUserService = function() {
			AppsOfAPIService.getUserIndexData($scope.userID).then(function (results) {
				passTasksToScope(results);
				$scope.no_internet = false;
			}, function(message) {
  				$scope.no_internet = true;
			});
		}


		getUserService();

	    $scope.toggle_filter = function() {
	        if ($scope.filter_applied){
	        	$scope.filter_applied = false;
	        	$scope.query = {};
	        }else{
	        	$scope.filter_applied = true;
	        	$scope.query = { fave_ind: 'true' };
	        	$ionicScrollDelegate.scrollTop();
	        }

	    };

	    $scope.hide_top_card = function() {
	    	$scope.messageAnimate="dn-fade-up"
	        $scope.top_card = false;
	    };

		$rootScope.$on('refresh-index', function(event, args) { //listener for refresh index event, to refresh data
			getUserService();
		});

		$scope.doRefresh = function() {
			$scope.top_card = true;
		    getUserService();
		    $scope.$broadcast('scroll.refreshComplete');
		};


	}])

	.controller('TaskCtrl', function ($scope, $rootScope, $timeout, $localstorage, $stateParams, $ionicHistory, AppsOfAPIService) {

		utID = $stateParams.user_taskID
		utLocal = $localstorage.getObject('user_task_' + utID)
		

		if (Object.keys(utLocal).length > 0){
			passTaskToScope(utLocal, true);
		}else{
			$scope.step = 'first_seen';
		}

  		//handle the steps/messages that appear
  		//values are:  'first_seen', 'already_seen', 'will_complete', 'just_completed', 'completed', 'do_not_show', 'offline'
  		
		$scope.setCurrentStep = function(step) {
		    $scope.step = step;
		};
		
		//to get around user task being a promise
		function passTaskToScope(result, already_seen) {
			$scope.task = result.task;
			$scope.user_task = result.user_task;

			if (result.user_task.complete_ind){
				$scope.step = 'completed'
			}else if (result.user_task.do_not_show_ind){
				$scope.step = 'do_not_show'
			}else if (already_seen){
				$scope.step = 'already_seen';
			}

			if ($scope.no_internet){
				$scope.step = 'offline'
			}
		}

		AppsOfAPIService.getUserTask($stateParams.user_taskID).then(function(result) {
			passTaskToScope(result, false);
			$scope.no_internet = false;
		}, function(message) {
  			$scope.no_internet = true;
		});


		//can this be removed with latest ionic version???
	    $scope.onswiperight = function() {
          	$ionicHistory.goBack();
	    };


		$scope.mark_will_do = function() {
			$scope.step = 'will_complete'

	        $timeout(function() {
	          $scope.step = 'already_seen'
	        }, 5000);
		}	

		$scope.mark_complete = function() {
			$scope.step = 'just_completed'
			$scope.user_task.complete_ind = true
			$scope.updateTask();
		}		

		$scope.updateFave = function() {
			if ($scope.user_task.fave_ind){
				$scope.user_task.fave_ind = false;
			}else{
				$scope.user_task.fave_ind = true;
			}
			$scope.updateTask();
		}

	    $scope.updateTask = function() {
          var user_task = { "user_task": { id: $scope.user_task.id, fave_ind: $scope.user_task.fave_ind, complete_ind: $scope.user_task.complete_ind, do_not_show_ind: $scope.user_task.do_not_show_ind } }

		  AppsOfAPIService.updateUserTask(user_task).then(function(response) {

		  	if (response.message != "OK"){
		  	  $scope.message=response.message;

		      $timeout(function() {
		        $scope.step = 'completed'
		      }, 10000);		  		
		  	}
		  	
          	$rootScope.$broadcast("refresh-index");
		  });  
	    };



	})


	.controller('SettingsCtrl', ['$scope', '$filter', '$timeout', '$localstorage', 'getUser', '$ionicHistory', 'AppsOfAPIService', function($scope, $filter, $timeout, $localstorage, getUser, $ionicHistory, AppsOfAPIService){

		$scope.userID = getUser;
		$scope.message = { showMessage: false };

		settingsLocal = $localstorage.getObject('settings');

		if (Object.keys(settingsLocal).length > 0){
			passSettingsToScope(settingsLocal);
		}
		
		//to get around being a promise
		function passSettingsToScope(result) {
//			console.log(result.user.id)			
			$scope.user = result.user;

			$scope.user.send_time = new Date($scope.user.send_time)
			if (result.next_send) $scope.next_send = new Date(result.next_send)	
			updateReceiveDate()

			$scope.user_categories = result.categories;
		}

		AppsOfAPIService.getSettings($scope.userID).then(function(result) {
			passSettingsToScope(result);
			$scope.no_internet = false;
		}, function(message) {
  			$scope.no_internet = true;
		});
	    
	    $scope.onswiperight = function() {
          	$ionicHistory.goBack();
	    };

	    $scope.updateUserSettings = function() {
          var user = { "user": { id: $scope.userID, send_time: $scope.user.send_time, push_ind: $scope.user.push_ind } }

		  AppsOfAPIService.updateUser(user).then(function(response) {
			//displayMessage("Your notification settings are recorded")
			updateReceiveDate()
		  });
	    };

	    $scope.updateCategory = function(uc) {
          var uc = { "user_category": { id: uc.id, subscribe_ind: uc.subscribe_ind } }

		  AppsOfAPIService.updateUserCategory(uc).then(function(response) {
			//displayMessage("Your notification settings successfully updated")
		  });
	    };


		function updateReceiveDate(){    

			current_day = new Date()
			current_hours = new Date().getHours()

			//if the time hasn't passed today, and it's been at least 13 hours since last send, we can send today
			if (($scope.user.send_time.getHours() > current_hours) && ($scope.next_send <= current_day)){
				$scope.receive_date = "today at " + $filter('date')($scope.user.send_time, 'shortTime')
			}else{
				$scope.receive_date = "tomorrow at " + $filter('date')($scope.user.send_time, 'shortTime')
			}
	    
	    };


		var displayMessage = function(message){    
	      $scope.message = { 
	        showMessage: true,
	        messageText: message
	      };
	    
	      $timeout(function() {
	        $scope.message = { showMessage: false};
	      }, 3000);
	    
	    };


	}])
	.controller('ErrorCtrl', function ($scope) {})

	