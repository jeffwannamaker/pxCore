#!/bin/bash
#script to check for corefile and get the corestack reported

path="$1"
binary="$2"
logfile="$3"
cd $path
ls -lrt core
retVal=$?
if [ "$retVal" -eq 0 ]
then
tempLogFile="gdb.txt"
gdb -q --command="$TRAVIS_BUILD_DIR/ci/gdbcmds" -c core $binary  2&>gdblogs
if [ "$TRAVIS_PULL_REQUEST" != "false" ]
then
echo "Core stack details ---------------------------------------- from $path"
cat $tempLogFile
else
echo "Core stack details ---------------------------------------- from $path" >> $logfile
cat "$tempLogFile" >> $logfile
fi
rm -rf "$tempLogFile"
rm -rf gdblogs
else
echo "No core files generated in $path"
fi
exit 0;
