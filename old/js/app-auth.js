'use strict';
// declare modules
angular.module('Authentication', ['ngCookies'])
  .controller('SubmitLogin', [ '$scope', '$http', '$cookies', '$window', function($scope, $http, $cookies, $window) {
    $scope.error = [];
	$scope.submit = function() {
      var authdata = btoa($scope.username + ':' + $scope.password);
      $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;
	  $http.defaults.headers.common['X-Atlassian-Token'] = 'no-check';
	  $http.defaults.headers.common['Cache-Control'] = 'no-cache';
	  $http.defaults.headers.common['Pragma'] = 'no-cache';
	  $http.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
	  $http.defaults.headers.common['Access-Control-Allow-Credentials'] = 'true';
	  
      $http.defaults.withCredentials = true;
      $http.get('/bamboo/rest/api/latest/currentUser')
       .then(function successCallback(response) {
         $cookies.put("bamboo_auth",authdata);
		 $cookies.put("bamboo_user",response.data.name);
		 $window.location.href = 'index.html';
       }, function errorCallback(error) {
         $scope.error.push(error.data.message);
       });
    };
  }]);


  
  
  