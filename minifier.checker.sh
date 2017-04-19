#!/bin/bash
# This is a simple try to process user input: it can add ".haze.yandex.net" automatically, wow! You can do just: ./minifier.checker.sh sovetnik-dev04e
pattern="\."
if [[ $1 =~ $pattern ]]; then
	host=$1
else
	host=$1".haze.yandex.net"
fi
# This gets script $version using $host and hardcoded path to a main Sovetnik script: static/js/sovetnik.min.js
version="$(curl -vk https://$host/static/js/sovetnik.min.js 2>&1 | grep "^\/\*\ Build\ " | grep -o "[0-9]\{12\}$")"
if [ -z $version ]; then
	echo "Couldn't get static/js/sovetnik.min.js from host" $host
	exit 1
else
	echo "Script version:" $version
fi

npm install

status=0
originalScriptPrefix="orig"
zippedPattern="\.zip$"
maxScriptPattern="\/max\/"
# This is formatted log message
report(){
	echo -e "===	$1"
}
# Blue log message
reportBlue(){
	tput setaf 6
	echo
	echo -e "===	$1"
	tput sgr0
}
# Clever log message
reportClever(){
	if [[ $1 -ne 0 ]]; then
		tput setaf 1
		report "$2 FAIL"
		tput sgr0
	else
		tput setaf 2
		report "$2 PASS"
		tput sgr0
	fi
}

# This checks if we haven't got an error and reports nice PASS/FAIL message.
errorCheck (){
	if [ $? -ne 0 ]; then
		tput setaf 1
		status=1
		report "FAILED on script/folder: $1"
		tput sgr0
	else
		tput setaf 2
		report 'PASS'
		tput sgr0
	fi
}
# This compares 2 files/folders recursively and calls to report PASS/FAIL.
compareScripts(){
	report "Comparing scripts $1 and $originalScriptPrefix.$1..."
	diff -r -q -x popup.html -x overlay.xul -I "^\/\*\ Build" $1 $originalScriptPrefix.$1
	errorCheck $1
}
# Syntax: createMinifier <name>
#
# This creates a temporary folder named $version.<name>, copies all minifier's files into that folder, steps inside the folder using cd.
createMinifier(){
	dir=$version.$1
	mkdir $dir
	cp -R banner gruntfile.js node_modules package.json npm-shrinkwrap.json postcss webpack $dir
	cd $dir
	#report "$dir directory created, minifier copied inside..."
}
# And this removes all these ^^^ folders.
cleanAllMinifiers(){
	if [[ $status -eq 0 ]]; then
		#report "Cleaning up some stuff..."
		rm -rf $version.*
	fi
}
# Syntax: wgetBetter <localCopyFileName> <url>
#
# wgetBetter downloads file (no shit like certificate issues or any non-error output), unzipes it if it's zipped, then checks if it's not max-script (so it is non-zip file which is not from /max/ folder; so it seems to be original minified script)
# and prefixes it's name with $originalScriptPrefix; otherwise it seems to be a max-script, and wgetBetter just downloads and saves it.
wgetBetter(){
	wget -O $1 -q --no-check-certificate $2
	# if zipped, unzip and remove source
	if [[ $1 =~ $zippedPattern ]]; then
		#report "Downloading $1, a zipped file, unzipping..."
		unzip -q $1
		rm $1
	# if NOT max-script, prefix its name with $originalScriptPrefix
	elif ! [[ $2 =~ $maxScriptPattern ]]; then
		#report "Downloading $1, an original minified script..."
		mv $1 $originalScriptPrefix.$1
	#if none of the above, just download this script
	#else
		#report "Downloading $1, which is a max-script..."
	fi
}

cleanAllMinifiers

#sovetnik.min.js script check (Chrome, Opera, Old Opera)
createMinifier sovetnik.min.js

wgetBetter sovetnik.min.js https://$host/static/js/sovetnik.min.js
wgetBetter sovetnik.max.js https://$host/static/js/max/sovetnik.$version.js

reportBlue "Building sovetnik.min.js..."
grunt
compareScripts sovetnik.min.js

#Webkit extension injectors and internal script check (Chrome, New Opera extensions with button)
#mkdir chrome
#cd chrome
#wget -q --no-check-certificate https://$host/sovetnik/extension/chrome.zip
#unzip chrome.zip > /dev/null

#mv sovetnik-internal.min.js ../sovetnik-internal.orig.js
#mv sovetnik-inject-background.min.js ../sovetnik-inject-background.orig.js
#mv sovetnik-inject-content.min.js ../sovetnik-inject-content.orig.js
#cd ..

#wget -q --no-check-certificate -O sovetnik-internal.js https://$host/static/js/max/sovetnik-internal.$version.js
#wget -q --no-check-certificate https://$host/static/js/max/extensions/chrome/sovetnik-inject-background.js
#wget -q --no-check-certificate https://$host/static/js/max/extensions/chrome/sovetnik-inject-content.js

#echo 'Building internal script and injectors...'
#grunt extension
#compareScripts sovetnik-inject-background.min.js sovetnik-inject-background.orig.js
#compareScripts sovetnik-inject-content.min.js sovetnik-inject-content.orig.js
#compareScripts sovetnik-internal.min.js sovetnik-internal.orig.js

#Firefox XUL Extension (no ping requests)
cd ..
createMinifier firefox-xul

wgetBetter ff-amo.zip https://$host/sovetnik/extension/ff-amo.xpi

mkdir split-code
cd split-code
wgetBetter split-code.zip https://$host/static/js/max/extensions/firefox/$version/split-code.zip
cd ..
mv content $originalScriptPrefix.content

reportBlue "Building Firefox XUL Extension..."
grunt xul
mv sovetnik/chrome/content content

compareScripts content/

#Firefox Web Extension Default
cd ..
createMinifier firefox-webextension

wgetBetter firefox-webextension.zip https://$host/sovetnik/extension/firefox-webextension.zip

mkdir split-code
cd split-code
wgetBetter split-code.zip https://$host/static/js/max/extensions/firefox-webextension-default/$version/split-code.zip
cd ..
mv sovetnik $originalScriptPrefix.sovetnik

reportBlue "Building Firefox Web Extension Default..."
grunt web-extension --type=firefox-webextension
compareScripts sovetnik/

#Firefox Web Extension Distribution
cd ..
createMinifier firefox-webextension-distribution

wgetBetter firefox-webextension-distribution.zip https://$host/sovetnik/extension/firefox-webextension-distribution.zip

mkdir split-code
cd split-code
wgetBetter split-code.zip https://$host/static/js/max/extensions/firefox-webextension-distribution/$version/split-code.zip
cd ..
mv sovetnik $originalScriptPrefix.sovetnik

reportBlue "Building Firefox Web Extension Distribution..."
grunt web-extension-distribution --type=firefox-webextension
compareScripts sovetnik/

#Firefox Web Extension Yandex
cd ..
createMinifier firefox-webextension-yandex

wgetBetter firefox-webextension-yandex.zip https://$host/sovetnik/extension/firefox-webextension-yandex.zip

mkdir split-code
cd split-code
wgetBetter split-code.zip https://$host/static/js/max/extensions/firefox-webextension-yandex/$version/split-code.zip
cd ..
mv sovetnik $originalScriptPrefix.sovetnik

reportBlue "Building Firefox Web Extension Yandex..."
grunt web-extension --type=firefox-webextension --clid=2282957 --affId=1112
compareScripts sovetnik/

#Chrome Extension
cd ..
createMinifier chrome-extension

wgetBetter chrome.zip https://$host/sovetnik/extension/chrome.zip

mkdir split-code
cd split-code
wgetBetter split-code.zip https://$host/static/js/max/extensions/chrome/$version/split-code.zip
cd ..
mv sovetnik $originalScriptPrefix.sovetnik

reportBlue "Building Chrome Extension..."
grunt web-extension
compareScripts sovetnik/

#Chrome Extension Distribution
cd ..
createMinifier chrome-extension-distribution

wgetBetter chrome-elements.zip https://$host/sovetnik/extension/chrome-elements.zip

mkdir split-code
cd split-code
wgetBetter split-code.zip https://$host/static/js/max/extensions/chrome-elements/$version/split-code.zip
cd ..
mv sovetnik $originalScriptPrefix.sovetnik

reportBlue "Building Chrome Extension Distribution..."
grunt web-extension-distribution
compareScripts sovetnik/

#Opera Extension
cd ..
createMinifier opera-extension

wgetBetter opera.zip https://$host/sovetnik/extension/opera.zip

mkdir split-code
cd split-code
wgetBetter split-code.zip https://$host/static/js/max/extensions/opera/$version/split-code.zip
cd ..
mv sovetnik $originalScriptPrefix.sovetnik

reportBlue "Building Opera Extension..."
grunt web-extension
compareScripts sovetnik/

cd ..
cleanAllMinifiers
# If at least one failed happened, will return 1; otherwise 0
reportClever $status "Overall status:"
exit $status
