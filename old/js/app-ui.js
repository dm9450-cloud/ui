var devopsUI = angular.module('DevOpsUI', ['ngCookies']);
devopsUI.controller('CheckCookie', [ '$scope', '$http', '$cookies', '$window', function($scope, $http, $cookies, $window) {
    $scope.authdata = $cookies.get("bamboo_auth");
  }]);
devopsUI.controller('FetchData', [ '$scope', '$http', '$cookies', '$window', '$filter', function($scope, $http, $cookies, $window, $filter) {
	// Check if logged in
	username = $cookies.get("bamboo_user");
	auth = $cookies.get("bamboo_auth");
	if(!username || !auth ) {
		alert(username);
		alert(auth);
		//$window.location.href = 'login.html';
	}
	$scope.username = username;
	$scope.tableData = [];
	$scope.error = [];
	$scope.debug = [];
	$scope.info = [];
	$scope.environments = ['dev','sit','uat','prd'];
	$scope.tableData.push({
		id:'1', name:'Data Quality', 
		rowData: [ {projectId:'322863163', name:'DQ Framework'},
				   {projectId:'380960770', name:'DQ Lambda'},
				   {projectId:'380960769', name:'DQ Util'},
				   {projectId:'376111125', name:'DQ Resources'}]
		});
	$scope.tableData.push({
		id:'2', name:'IngenirRx Data Warehouse', 
		rowData: [ {projectId:'339902537', name:'IDW Framework'},
				   {projectId:'387907622', name:'IDW Lambda - Java'},
				   {projectId:'400392221', name:'IDW Lambda - Python'},
				   {projectId:'373653529', name:'IDW Triggers'}]
		});
	$scope.tableData.push({
		id:'3', name:'Altus', 
		rowData: [ {projectId:'376111120', name:'Altus Lambda'} ]
		});
	//alert($scope.tableData);
	
	$http.defaults.headers.common['Authorization'] = 'Basic ' + auth;
	$http.defaults.headers.common['X-Atlassian-Token'] = 'no-check';
	$http.defaults.headers.common['Cache-Control'] = 'no-cache';
	$http.defaults.headers.common['Pragma'] = 'no-cache';
	$http.defaults.headers.common['Content-Type'] = 'application/json';
	$http.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
	$http.defaults.headers.common['Access-Control-Allow-Credentials'] = 'true';
	
	$http.defaults.withCredentials = true;
	$scope.tableData.forEach(function(projectList) {
		projectList.rowData.forEach(function(row) {
		  row.test='This is test';
	      $http.get('/bamboo/rest/api/latest/deploy/project/'+row.projectId)
           .then(function processEnvironmentResponse(response) {
		   
		    var envList = response.data.environments;
		    row.envData = [];
		    for (let envIndex in envList) {
			  var environment = envList[envIndex];
			  var envId = environment.id;
			  var envName = environment.name;
			  var deployVersionId = '';
			  var deployStatus =  '';
			  var tableRow = {};
			  tableRow.id = envId;
			  //tableRow.group = projectList.name;
			  tableRow.envName = envName;
			  row.envData.push(tableRow);
			
			}  
			row.envData.forEach(function(envInfo) {
			
			  var resultsUrl = '/bamboo/rest/api/latest/deploy/environment/'+envInfo.id+'/results?max-result=1';
			  //$scope.debug.push(resultsUrl);
			  $http.get(resultsUrl)
				.then(function successCallback(resultsResponse) {
					//$scope.debug.push(resultsResponse);
					if (resultsResponse.data.size > 0) {
						var environmentId = resultsResponse.data.results[0].key.entityKey.key.split('-')[1];
						var rowDataList = $filter('filter')($scope.tableData, {'rowData': {'envData': {'id':environmentId}}})[0].rowData;
						var envList = $filter('filter')(rowDataList, {'envData': {'id':environmentId}})[0].envData;
						var env = $filter('filter')(envList, {'id':environmentId})[0];
						//alert(row.id)
						//var row = $filter('filter')(rowDataList, {'id':environmentId})[0];
						env.deployVersion = resultsResponse.data.results[0].deploymentVersion.name;
						env.deployVersionId = resultsResponse.data.results[0].deploymentVersion.id;
						env.deployResultId = resultsResponse.data.results[0].key.resultNumber;
						env.deployStatus = resultsResponse.data.results[0].deploymentState;
						//$scope.debug.push(row.envName+'--'+row.deployVersion +'--'+row.deployStatus);
					}
				}, function errorCallback(resultsError) {
					//alert('ERROR');
					$scope.error=[]
					$scope.error.push(resultsError.data.message);
					$scope.debug.push(resultsError);
				});
			});
		  }, function errorCallback(resultsError) {
			//alert('ERROR');
			$scope.error=[];
			$scope.error.push(resultsError.data.message);
			$scope.debug.push(resultsError);
		  });
		});
	});
	
	$scope.promotetoEnv = function(projectId, module, fromEnvironmentName, toEnvironmentName) {
		project = $filter('filter')($scope.tableData, {'projectId':projectId})[0];
		fromEnvironment = $filter('filter')(project.rowData, {'module': module, 'envName': fromEnvironmentName})[0];
		
		toEnvironment = $filter('filter')(project.rowData, {'module': module, 'envName': toEnvironmentName})[0];
		$scope.debug = [];
		$scope.debug.push({project: project, fromEnvironment: fromEnvironment, toEnvironment: toEnvironment});
		$http.post('/bamboo/rest/api/latest/queue/deployment/?environmentId='+toEnvironment.id+'&versionId='+fromEnvironment.deployVersionId,null,{ withCredentials: true, headers:{ 'Authorization':  'Basic ' + auth }})
		.then(function successCallback(successResponse) {
			resultsLink = successResponse.data.link.href;
			resultsId = successResponse.data.deploymentResultId;
			$scope.info = [];
			$scope.info.push({text: 'Successfully submitted deployment for version '+fromEnvironment.deployVersion+' from '+fromEnvironmentName+' to '+toEnvironmentName+'.'});
			$scope.info.push({text: 'Check deployment status here.', link: 'https://bamboo.anthem.com/deploy/viewDeploymentResult.action?deploymentResultId='+resultsId});
			//Refresh State
			var rowDataList = $filter('filter')($scope.tableData, {'rowData': {'id':toEnvironment.id}})[0].rowData;
			var row = $filter('filter')(rowDataList, {'id':toEnvironment.id})[0];
			row.deployVersion = fromEnvironment.deployVersion;
			row.deployVersionId = fromEnvironment.deployVersionId;
			row.deployResultId = resultsId;
			row.deployStatus = 'UNKNOWN';
				
			
			
		}, function errorCallback(errorResponse) {
			$scope.error = [];
			$scope.error.push(errorResponse.data.message);
			$scope.debug.push(errorResponse);
		});
		
		
	};
	
	
	$scope.logout = function() {
		
		$cookies.remove("bamboo_auth");
		$cookies.remove("bamboo_user");
		$window.location.href = 'login.html';
	};
	
  }]);
  
  
  