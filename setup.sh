#! /bin/sh
echo 'setup'

lib='./lib'
ngVersion='1.3.10'
ngString="angular-$ngVersion"
ngZip=$ngString".zip"

if [ ! -d $lib ]; then
	echo 'setup lib dir'
	mkdir $lib
	chmod go+rx $lib
fi

if [ ! -f $lib/d3.js ]; then
	echo 'get d3'
	curl https://raw.githubusercontent.com/mbostock/d3/master/d3.js -o $lib/d3.js
fi

if [ ! -f $lib/angular.zip ] && [ ! -f $lib/$ngString/angular.js ]; then
	echo 'get angular zip'
	curl -Lk https://code.angularjs.org/$ngVersion/$ngZip -o $lib/angular.zip
fi

if [ -f $lib/angular.zip ] && [ ! -f $lib/$ngString/angular.js ]; then
	echo 'install angular and cleanup'
	#unzip angular.zip js/lib/$ngString/*.* -x * -d ./ -u -o
	unzip $lib/angular.zip -d $lib/
	cd $lib/
	ln -s ./$ngString ./ng
	cd ..
	rm -f $lib/angular.zip 
fi

echo 'update har loader'
curl https://raw.githubusercontent.com/thtr/harharhar/master/harharhar.js -o $lib/harharhar.js

echo 'fix permissions'
chmod -R go+r ui

echo 'all done'

