#!/bin/bash
# Use GParsley program to create a comprehensive index.html (table of contents)
# using all CSV files
# zip up all to prep for FTP to website update
#
# ref URLs:
# http://askubuntu.com/questions/777049/how-do-i-zip-up-multiple-files-on-command-line
#
mv 0gparsnip.csv 0gparsnip.csx
rm index.csv
cat *.csv > index.csx
mv index.csx index.csv
nodejs gparsley index "eSongbook of Unusual Size" "v0.13"
zip 0index.zip *.htm *.html *.txt *.lst *.pro 0chordlyric.css 0lyricsonly.css index.html
mv 0gparsnip.csx 0gparsnip.csv

