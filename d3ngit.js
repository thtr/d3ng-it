'use strict'
angular.module('d3ngit', ['ngRoute'])
.run(function($templateCache){
	var path, template = {
		'app.html': '<section ng-repeat="template in content track by $index" title="{{params.view}}"><span ng-include src="template"></span></section>'
		,'home.html': "<p>home: for more just <a href='#/stuff?and=things'>add something to the path</a></p>"
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
		,template: '<form ng-submit="adjust()" class=transformit><style>.transformit code{width:3em;text-align:right;overflow:auto;display:inline-block;border:1px solid #ddd;}</style>'
			+'<br><select ng-model="svg.xAspect" ng-options="x for x in svg.preserveAspectRatio.x"></select>'
			+'<br><select ng-model="svg.yAspect" ng-options="y for y in svg.preserveAspectRatio.y"></select>'
			+'<br><select ng-model="svg.clip" ng-options="c for c in svg.preserveAspectRatio.c"></select>'
			+'<br><label for="w-{{id}}">width <code>{{svg.width.value}}</code></label><input id="w-{{id}}" type=range min="{{svg.width.min}}" max="{{svg.width.max}}" step="{{svg.width.step}}" ng-model="svg.width.value" >'
			+'<br><label for="h-{{id}}">height <code>{{svg.height.value}}</code></label><input id="h-{{id}}" type=range min="{{svg.height.min}}" max="{{svg.height.max}}" step="{{svg.height.step}}" ng-model="svg.height.value" >'
			+'</form>'
		,controller: function($scope){
		// init the model
			$scope.id = 'vis-'+$scope.$id;
			$scope.model = d3.range(8, 876, 3);

			var spaces = /\s+/;
			$scope.svg = {
				preserveAspectRatio: {
					x: 'xMin xMid xMax'.split(spaces)
					,y: 'YMin YMid YMax'.split(spaces)
					,c: 'meet slice'.split(spaces)
				}
				,width: {value: 350, min: 20, max: 900, step: 10}
				,height: {value: 300, min: 20, max: 700, step: 10}
			};
			$scope.svg.xAspect = $scope.svg.preserveAspectRatio.x[1];
			$scope.svg.yAspect = $scope.svg.preserveAspectRatio.y[1];
			$scope.svg.clip = $scope.svg.preserveAspectRatio.c[0];

			$scope.valid = function(dimension){
				var n = Number(dimension.value) || 0;
				if(n < dimension.min) n = dimension.min;
				else if(n > dimension.max) n = dimension.max;
				else n -= (n % dimension.step);

				dimension.value = n;
			};

			$scope.validAdjustments = function(dimensions, previous){
				var dimension, key, old, nu, changes = {length:0}, was;
				for(key in dimensions){
					old = ((previous||{})[key] || {}).value;
					dimension = dimensions[key];
					if(!dimension.value) continue;
					$scope.valid(dimension);
					nu = dimension.value;
					if(nu === old) continue;
					changes.length++;
					changes[key] = dimension;
				};
				return changes;
			};
		}
		,link: function(scope, elem, attrs){
		// create the view
			var $svg;

			// setup visualization initially
			scope.render = function(model, old, scope){

				// render the data when it changes
				var bar = d3.select('#svg-'+scope.id).selectAll('.bar').data(model || []);

				var y = d3.scale.linear()
					.domain([ model[0], model[model.length-1] ])
					.range([0, scope.svg.height.value])
				;
				var w = 2, h = scope.svg.height.value;

				bar
				.enter()
				.append('rect').attr('class','bar')
				.attr('width',w)
				.attr('height',y)
				.attr('x',function(d,i,a){
					return (i * w);
				})
				.attr('y',function(d,i){
					return (h - y(d));
				})

				bar.exit().each(function(d,i){
					console.log('<exit '+i+'>',d);
				})
				.remove();
			};

			// TODO improve so that values can be dynamically adjusted (via scope.$watch or attrs.$observe then set attribute to value)
			$svg = $compile(
				$interpolate('<svg width="{{svg.width.value}}" height="{{svg.height.value}}" class="vis-sample" id="svg-{{id}}" ></svg>')( scope )
			)( scope );

			// ?? is this the best solution?
			d3.select( $svg[0] ).datum( scope.model );

			elem.append( $svg );

			scope.$watch('svg', function(svg, old, scope){
				var changes = scope.validAdjustments(svg);
				if(!changes.length) return;

				$svg
					.attr('width', svg.width.value)
					.attr('height', svg.height.value)
					.attr('viewBox', '0 0 '+svg.width.value+' '+svg.height.value)
					.attr('preserveAspectRatio', svg.xAspect + svg.yAspect + ' ' + svg.clip)

				document.getElementById('w-'+scope.id).value = scope.svg.width.value;
				document.getElementById('h-'+scope.id).value = scope.svg.height.value;
			}, true);

			scope.$watchCollection('model', scope.render);
		}
	};
})

;
