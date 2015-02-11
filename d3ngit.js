'use strict'
angular.module('d3ngit', ['ngRoute'])
.run(function($templateCache){
	var path, template = {
		'app.html': '<section ng-repeat="template in content track by $index" title="{{params.view}}"><span ng-include src="template"></span></section>'
		,'home.html': "<p>home</p>"
		,'404.html': "<p>Sorry, couldn't find <a href='{{url}}'><code>{{url}}</code></a></p>"
	};
	for(path in template) $templateCache.put(path, template[path]);
})
.config(function($locationProvider, $routeProvider){
	$routeProvider.when('/', {templateUrl: 'app.html'
	,controller: function($scope, $location){
		$scope.content = ['home.html'];
	}
	})
	.otherwise({templateUrl: 'app.html', controller: function($scope){
		$scope.url = location.pathname + location.search + location.hash;
		$scope.content = ['404.html'];
	}})
	;

})

;
