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
cp index.csx index.csv
nodejs gparsley index "eSongbook of Unusual Size" "v0.249"
zip 0index.zip *.htm *.html *.txt *.lst *.pro 0chordlyric.css 0lyricsonly.css index.html
#rm *.htm *.html *.txt *.lst *.cd1 *.csv
rm *.csv
mv 0gparsnip.csx 0gparsnip.csv
mv index.csx index.csv
