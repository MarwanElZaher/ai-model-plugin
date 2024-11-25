#!/bin/sh
for file in $(find /usr/share/nginx/html -iname "*.css" -o -iname "*.html" -o -iname "*.js")
do
        /bin/sed -i "s|GATEWAY_URL|${GATEWAY_URL}|g"  $file
done
nginx -g 'daemon off;'