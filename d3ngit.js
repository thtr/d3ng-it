'use strict'
angular.module('d3ngit', ['ngRoute'])
.run(function($templateCache){
	var path, template = {
		'app.html': '<section ng-repeat="template in content track by $index" title="{{params.view}}"><span ng-include src="template"></span></section>'
		,'home.html': "<p style='margin:8em;font-size:large;'>home: for more just <a href='#/stuff?and=things'>add something to the path</a></p>"
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
.directive('visiBar', function($compile, $interpolate, d3, visUtil){
	return {
		restrict: 'E'
		,scope: true
		,template: '<form ng-submit="adjust()" class=transformit><style>.transformit code{width:3em;text-align:right;overflow:auto;display:inline-block;border:1px solid #ddd;}</style>'
			+'<br><select ng-model="svg.xAspect" ng-options="x for x in svg.preserveAspectRatio.x"></select>'
			+'<br><select ng-model="svg.yAspect" ng-options="y for y in svg.preserveAspectRatio.y"></select>'
			+'<br><select ng-model="svg.clip" ng-options="c for c in svg.preserveAspectRatio.c"></select>'
			+'<br><label for="w-{{id}}">width <code>{{svg.width.value}}</code></label><input id="w-{{id}}" type=range min="{{svg.width.min}}" max="{{svg.width.max}}" step="{{svg.width.step}}" ng-model="svg.width.value" >'
			+'<br><button ng-click="reset($event)">reset data</button>'
			+'<br><label for="h-{{id}}">height <code>{{svg.height.value}}</code></label><input id="h-{{id}}" type=range min="{{svg.height.min}}" max="{{svg.height.max}}" step="{{svg.height.step}}" ng-model="svg.height.value" >'
			+'</form>'
		,controller: function($scope){
		// init the model
			$scope.id = 'vis-'+$scope.$id;

			$scope.reset = visUtil.modelReset;
			$scope.reset();

			var spaces = /\s+/;
			$scope.svg = {
				preserveAspectRatio: {
					x: 'xMin xMid xMax'.split(spaces)
					,y: 'YMin YMid YMax'.split(spaces)
					,c: 'slice meet none'.split(spaces)
				}
				,width: {value: 800, min: 20, max: 900, step: 10}
				,height: {value: 700, min: 20, max: 700, step: 10}
			};
			$scope.svg.xAspect = $scope.svg.preserveAspectRatio.x[1];
			$scope.svg.yAspect = $scope.svg.preserveAspectRatio.y[1];
			$scope.svg.clip = $scope.svg.preserveAspectRatio.c[0];

		}
		,link: function(scope, elem, attrs){
		// create the view
			var $svg;

			scope.yAxis = d3.svg.axis();

			scope.farRight = function(){
				return (this.model.length + 1) * this.barWidth;
			};

			// setup visualization initially
			scope.render = function(model, old, scope){

				// render the data when it changes
				var chart = d3.select('#svg-'+scope.id).select('.bar-chart').attr('transform','translate(10,10)');
				var bar = chart.select('.bars').selectAll('.bar').data(model || []);

				var extent = d3.extent(model);
				scope.min = extent[0];
				scope.max = extent[1];

				var width = 300;
				// at least 1px for each bar
				if( model.length > width) width = model.length;
				var barWidth = Math.round(width / model.length);
				scope.barWidth = barWidth;
				var height = 300;

				// fit the model items into the available width
				// fix as bands
				var x = d3.scale.linear()
					.domain([ 0, model.length - 1 ])
					.rangeRound([ 0, width ])
					.nice()

				var y = d3.scale.linear()
					.domain([ scope.bounds.min, scope.bounds.max ])
					.range([height, 0])
					.clamp(true)
					.nice()

				var yAxis = scope.yAxis.scale(y).orient('right');

				scope.x = x;
				scope.y = y;

				// enter() for initializing un-changing values
				bar
				.enter()
				.append('rect').attr('class',function(d,i){
					return 'bar bar'+i;
				});

				// update
				bar
				.attr('width',barWidth)
				.attr('x',function(d,i){
					return i * barWidth;
				})
				.attr('height',function(d){
					return height - y(d);
				})
				.attr('y',y)
				.attr('d',function(d,i){
					return d;
				})
				.each(function(d,i){
					this.classList.remove('active');
				})

				// exit
				bar.exit().remove();

				var r = scope.farRight();
				var l = d3.select('#line-svg-'+scope.id);

				l.select('text').attr('y',height).attr('style','dominant-baseline:ideographic;text-shadow:0 0 8px #fff;fill:red;');
				scope.setIndicator(0, 0, '', l)

				l.select('line').attr('x1',0).attr('x2',r).attr('y1',height).attr('y2',height).attr('style','opacity:0.3;')

				chart.select('.y-axis').call(yAxis).attr('transform','translate('+ r +', 0)');

			};

			// TODO move edit to attribute directive generalized for svg element types and corresponding attributes
console.log('$compile->$interpolate');
			$svg = $compile(
				// angular messes up camelCase attributes (camelCase becomes camelcase) so $interpolate first
				$interpolate('<svg width="{{svg.width.value}}" height="{{svg.height.value}}" class="visi-bar" id="svg-{{id}}" ><g class="bar-chart"><g class="bars"></g><g class="axis y-axis"></g><g class="line-indicator" id="line-svg-{{id}}"><line></line><text dy=".32em" style="text-anchor: end;"></text></g></g>'
	+ '<g class="smiley"><rect width="180" height="240" fill="#666666"></rect> <circle cx="90" cy="120" r="60" fill="yellow" stroke="red" stroke-width="2"></circle> <circle cx="68" cy="105" r="14" fill="black"></circle> <circle cx="112" cy="105" r="14" fill="black"></circle> <path d="M 50 140 A 50 50 0 0 0 130 140" fill="black" stroke="none"></path> </g> </svg>')( scope )
			)( scope );

			scope.setIndicator = function(x, y, d, d3el){
				d3el.attr('style','transform:translate(0,-'+y+'px);').select('text').text(d).attr('x', x);
			};

			$svg.on('click', function(e){
				if(e.target.nodeName !== 'rect') return;
				e.target.classList.toggle('active');
			});
			$svg.on('mouseover',function(e){
				var el, y, x;
				if(e.target.nodeName !== 'rect') return;
				el = d3.select(e.target);
				e.view.angular.element(this).scope().setIndicator(
					+el.attr('x')
					,+el.attr('height')
					,el.attr('d')
					,d3.select('#line-'+this.id)
				);
			});

			// ?? is this the best solution?
			d3.select( $svg[0] ).datum( scope.model );

			elem.append( $svg );

			scope.$watch('svg', function(svg, old, scope){
				var changes = visUtil.validAdjustments(svg);
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
.factory('visUtil', function(d3){
	var visUtil = {
		random: function randomizing(min, max){
			min = min || 0;
			max = (typeof(max) === 'number' && max >= min) ? max : min;
			return Math.random() * (max - min + 1) + min;
		}
		,reset: function resetting(bounds){
			bounds = angular.extend({
				min: Math.round(visUtil.random(0, 50)), max: Math.round(visUtil.random(300, 543)), step: Math.round(visUtil.random(1, 10))
			}, bounds);

			bounds.magnitude = bounds.max - bounds.min;

			return bounds;
		}
		,modelReset: function modelResetting(){
		// assuming this is attached to a scope, so this===scope instance

			var bounds;
			bounds = this.bounds = visUtil.reset();
			
			this.model = d3.shuffle( d3.range(
			// min, max, step
				bounds.min, bounds.max, bounds.step
			) );
			console.clear();
			console.log(this.model.length, this.model);

			if(!this.$$phase && this.$apply) this.$apply( );
		}
		,valid: function(dimension){
			var n = Number(dimension.value) || 0;
			if(n < dimension.min) n = dimension.min;
			else if(n > dimension.max) n = dimension.max;
			else n -= (n % dimension.step);

			dimension.value = n;
		}
		,validAdjustments: function(dimensions, previous){
				var dimension, key, old, nu, changes = {length:0}, was;
				for(key in dimensions){
					old = ((previous||{})[key] || {}).value;
					dimension = dimensions[key];
					if(!dimension.value) continue;
					visUtil.valid(dimension);
					nu = dimension.value;
					if(nu === old) continue;
					changes.length++;
					changes[key] = dimension;
				};
				return changes;
		}
	};

	return visUtil;
})
.directive('visiWheel',function($compile, $interpolate, d3, visUtil){
	return {
		restrict: 'E'
		,scope: true
		,controller: function($scope){
		// init the model
			$scope.id = 'vis-'+$scope.$id;

			$scope.reset = visUtil.modelReset();

			var spaces = /\s+/;
			$scope.svg = {
				preserveAspectRatio: {
					x: 'xMin xMid xMax'.split(spaces)
					,y: 'YMin YMid YMax'.split(spaces)
					,c: 'slice meet'.split(spaces)
				}
				,width: {value: 800, min: 20, max: 900, step: 10}
				,height: {value: 700, min: 20, max: 700, step: 10}
			};
			$scope.svg.xAspect = $scope.svg.preserveAspectRatio.x[1];
			$scope.svg.yAspect = $scope.svg.preserveAspectRatio.y[1];
			$scope.svg.clip = $scope.svg.preserveAspectRatio.c[0];

		}
		,link: function(scope, elem, attrs){
		// create the view
			var $svg;

			scope.yAxis = d3.svg.axis();

			scope.farRight = function(){
				return (this.model.length + 1) * this.barWidth;
			};

			// setup visualization initially
			scope.render = function(model, old, scope){

				// render the data when it changes
				var chart = d3.select('#svg-'+scope.id).select('.bar-chart').attr('transform','translate(10,10)');
				var bar = chart.select('.bars').selectAll('.bar').data(model || []);

				var extent = d3.extent(model);
				scope.min = extent[0];
				scope.max = extent[1];

				var width = 300;
				// at least 1px for each bar
				if( model.length > width) width = model.length;
				var barWidth = Math.round(width / model.length);
				scope.barWidth = barWidth;
				var height = 300;

				// fit the model items into the available width
				// fix as bands
				var x = d3.scale.linear()
					.domain([ 0, model.length - 1 ])
					.rangeRound([ 0, width ])
					.nice()

				var y = d3.scale.linear()
					.domain([ scope.bounds.min, scope.bounds.max ])
					.range([height, 0])
					.clamp(true)
					.nice()

				var yAxis = scope.yAxis.scale(y).orient('right');

				scope.x = x;
				scope.y = y;

				// enter() for initializing un-changing values
				bar
				.enter()
				.append('rect').attr('class',function(d,i){
					return 'bar bar'+i;
				});

				// update
				bar
				.attr('width',barWidth)
				.attr('x',function(d,i){
					return i * barWidth;
				})
				.attr('height',function(d){
					return height - y(d);
				})
				.attr('y',y)
				.attr('d',function(d,i){
					return d;
				})
				.each(function(d,i){
					this.classList.remove('active');
				})

				// exit
				bar.exit().remove();

				var r = scope.farRight();
				var l = d3.select('#line-svg-'+scope.id);

				l.select('text').attr('y',height).attr('style','dominant-baseline:ideographic;text-shadow:0 0 8px #fff;fill:red;');
				scope.setIndicator(0, 0, '', l)

				l.select('line').attr('x1',0).attr('x2',r).attr('y1',height).attr('y2',height).attr('style','opacity:0.3;')

				chart.select('.y-axis').call(yAxis).attr('transform','translate('+ r +', 0)');

			};

			// TODO move edit to attribute directive generalized for svg element types and corresponding attributes

			$svg = $compile(
				// angular messes up camelCase attributes (camelCase becomes camelcase) so $interpolate first
				$interpolate('<svg width="{{svg.width.value}}" height="{{svg.height.value}}" class="visi-bar" id="svg-{{id}}" ><g class="bar-chart"><g class="bars"></g><g class="axis y-axis"></g><g class="line-indicator" id="line-svg-{{id}}"><line></line><text dy=".32em" style="text-anchor: end;"></text></g></g></svg>')( scope )
			)( scope );

			scope.setIndicator = function(x, y, d, d3el){
				d3el.attr('style','transform:translate(0,-'+y+'px);').select('text').text(d).attr('x', x);
			};

			$svg.on('click', function(e){
				if(e.target.nodeName !== 'rect') return;
				e.target.classList.toggle('active');
			});
			$svg.on('mouseover',function(e){
				var el, y, x;
				if(e.target.nodeName !== 'rect') return;
				el = d3.select(e.target);
				e.view.angular.element(this).scope().setIndicator(
					+el.attr('x')
					,+el.attr('height')
					,el.attr('d')
					,d3.select('#line-'+this.id)
				);
			});

			// ?? is this the best solution?
			d3.select( $svg[0] ).datum( scope.model );

			elem.append( $svg );

			scope.$watch('svg', function(svg, old, scope){
				var changes = visUtil.validAdjustments(svg);
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
.directive('visiWheel',function(){

})
;
