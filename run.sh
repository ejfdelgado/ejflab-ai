#!/bin/sh

cd /tmp/app

/usr/sbin/sshd -D &
recPID2=$!
echo $recPID2

node ./node_modules/@ejfdelgado/ejflab-common/src/changePath.js
node app.mjs