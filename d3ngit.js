'use strict'
angular.module('d3ngit', ['ngRoute'])
.run(function($templateCache){
	var path, template = {
		'app.html': '<section ng-repeat="template in content track by $index" title="{{params.view}}"><span ng-include src="template"></span></section>'
		,'home.html': "<p>home</p>"
		,"params.html":"<h1>params</h1><style>.codex code{display:block;}</style><div class=codex><code ng-repeat='(key, val) in params track by $index'>{{key}}: {{val}}</code></div>"
		,'404.html': "<p>Sorry, couldn't find <a href='{{url}}'><code>{{url}}</code></a></p>"
	};
	for(path in template) $templateCache.put(path, template[path]);
})
.config(function($locationProvider, $routeProvider){
	$routeProvider
	.when('/', {templateUrl: 'app.html'
	,controller: function($scope, $location){
		$scope.content = ['home.html'];
	}
	})
	.when('/:bits*', {templateUrl: 'app.html'
	,controller: function($scope, $routeParams, $location){
		var bits;
		bits = $routeParams.bits.split('/');
		$scope.params = bits.map(function(d){ return d ? d+'.html':d; })
		$scope.content = ['params.html','t-alt.html'];
	}
	})
	.otherwise({templateUrl: 'app.html', controller: function($scope){
		$scope.url = location.pathname + location.search + location.hash;
		$scope.content = ['404.html'];
	}
	})
	;
})
.directive('onReady',function(){
	return {
		restrict: 'A'
		,link: function(scope, element, attrs){
			if(scope.$last) scope.$emit('ready');
		}
	}
})
.directive('colorPicker',function(){
	return {
		restrict: 'E'
		,templateUrl: 't-colorpicking.html'
		,controller: function($scope){
			$scope.color = {hex: '#ccff00'};
		}
		,link: function(scope, element, attrs){
			if(scope.$last) scope.$emit('ready');
		}
	}
})
.factory('d3', function(){
	return window.d3;
})
.directive('visSample', function($compile, $interpolate, d3){
	return {
		restrict: 'E'
		,scope: true
		,template: '<form ng-submit="adjust()"><label for="w-{{id}}">width</label><input ng-model="svg.w" id="w-{{id}}" ng-blur="validWidth()"><input type=range min="{{minWidth}}" max="{{maxWidth}}" step="{{stepWidth}}" ng-model="svg.w"></form>'
		,controller: function($scope){
		// init the model
			$scope.id = 'vis-'+$scope.$id;
			$scope.model = d3.range(8, 876, 3);
			$scope.minWidth = 200;
			$scope.maxWidth = 700;
			$scope.stepWidth = 10;
			$scope.validWidth = function(){
				var w = Number(this.w) || this.minWidth;
				if(w < this.minWidth) w = this.minWidth;
				else if(w > this.maxWidth) w = this.maxWidth;

				w = w - (w % this.stepWidth);

				this.w = w;
			};
			$scope.adjust = function(){
				this.validWidth();
			};
		}
		,link: function(scope, elem, attrs){
		// create the view
			var svg;
			// setup visualization initially
			scope.render = function(){
				// render the data when it changes
			};

			scope.svg = {
				w: 350
				,h:300 
			};

			// TODO improve so that values can be dynamically adjusted (via scope.$watch or attrs.$observe then set attribute to value)
			var $svg = $compile(
				$interpolate('<svg width="{{svg.w}}" height="{{svg.h}}" class="vis-sample" id="vis-sample-{{id}}" viewBox="0 0 {{svg.w}} {{svg.h}}" preserveAspectRatio="xMidYMid meet"></svg>')( scope )
			)( scope );

			// ? d3.select( svg[0] ).datum( scope.model );

			elem.append( $svg );

			scope.$watch('svg', function(svg, old, scope){
				// TODO update svg properties
				console.log(+svg.w);
				if(+svg.w === old.w) return;
					$svg.attr('width', svg.w)
					.attr(
						'viewBox', $interpolate('0 0 {{svg.w}} {{svg.h}}')(scope)
					);
			}, true);
			scope.$watchCollection('model', scope.render);
		}
	};
})

;
