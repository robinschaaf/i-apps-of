var app = angular.module('i-apps-of', ['ionic', 'i-apps-of.services', 'i-apps-of.controllers', 'i-apps-of.utils', 'ngCordova', 'ui.router', 'ngtimeago', 'ngAnimate', 'angularMoment', 'ngAnimate-animate.css'])

  .config(['$sceDelegateProvider', function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist(['self','http://apps-of.heroku.com/**', 'http://apps-of.herokuapp.com/**', 'http://localhost:3000/**']);
  }])
  .config(function($ionicConfigProvider) {
    $ionicConfigProvider.backButton.text(' ').icon('ion-ios-arrow-left');
  })
  .config(function($httpProvider) {
    $httpProvider.interceptors.push(function($rootScope, $q) {
      return {
        request: function(config) {
          $rootScope.$broadcast('loading:show')
          return config
        },
        response: function(response) {
          $rootScope.$broadcast('loading:hide')
          return response
        },
        responseError: function(rejection) {
          $rootScope.$broadcast('loading:hide')
          return $q.reject(rejection);
        }
      }
    })
  })
  .config(function ($ionicConfigProvider, $stateProvider, $urlRouterProvider) {

    $stateProvider
    
      .state('user-index', {
        url: '/user',
        templateUrl: 'templates/user-index.html',
        resolve: {
          // Get AngularJS resource to query
          UserService: 'UserService',

          getUser: function(UserService){  // Use the resource to fetch data from the server
            return UserService.getUserID();
          }
        },
        controller: 'IndexCtrl'
      })

      .state('task', {
        url: '/tasks/:user_taskID',
        templateUrl: 'templates/task.html',
        controller: 'TaskCtrl'
      })

      .state('settings', {
        url: '/settings',
        templateUrl: 'templates/settings.html',
        resolve: {
          // Get AngularJS resource to query
          UserService: 'UserService',

          getUser: function(UserService){  // Use the resource to fetch data from the server
            return UserService.getUserID();
          }
        },
        controller: 'SettingsCtrl'
      })

      .state('error', {
        url: '/error',
        templateUrl: 'templates/error.html',
        controller: 'ErrorCtrl'
      })

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/user');

  })

  .run(function(ionPlatform, $state, $rootScope, SplashScreenService, $cordovaStatusbar) {

    ionPlatform.ready.then(function (device) {
      SplashScreenService.hide();

      if (typeof StatusBar !== 'undefined'){
        cordova.plugins.Keyboard.disableScroll(true)
        $cordovaStatusbar.overlaysWebView(true);
        $cordovaStatusbar.style(1); // styles: Default : 0, LightContent: 1, BlackTranslucent: 2, BlackOpaque: 3
        $cordovaStatusbar.styleColor('black');        
      }
    })


    $rootScope.$on('loading:show', function() {
      $rootScope.showLoader=true;
    })

    $rootScope.$on('loading:hide', function() {
        $rootScope.showLoader=false;
    })

    // Notification Received
    window.onNotification = function(event, notification) {
      if (ionic.Platform.isIOS()) {
        handleIOS(event, event.foreground, event.utid);  //handleIOS(event.payload.aps, event.foreground, event.payload.task_id);
      }
    }

    // open to the proper task
    window.openTask = function(tid) {
      if (tid > 0){
        $state.go("task", {user_taskID: tid})
      }
    }

    // IOS Notification Received Handler
    handleIOS = function (msg, fg, tid) {
        if ((msg.foreground == "1") || (fg == true)) {
            navigator.notification.alert("Your new notification has arrived.", function() { window.openTask(tid, 0);} , "The App of Happiness", "OK")

            if (msg.badge) {
              pushNotification = window.plugins.pushNotification;
              pushNotification.setApplicationIconBadgeNumber(successHandler, errorHandler, event.badge);  
            }

        }else {
            window.openTask(tid)
        }

        //be sure to refresh the index page!
        $rootScope.$broadcast('refresh-index');

    }

  })

