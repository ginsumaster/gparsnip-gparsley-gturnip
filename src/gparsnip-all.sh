#!/bin/bash
# Run gparsnip on all .pro files in current directory
#
# URLs:
# http://stackoverflow.com/questions/2297510/linux-shell-script-for-each-file-in-a-directory-grab-the-filename-and-execute-a
#
rm *.htm
rm *.html
rm *.txt
rm *.lst
rm *.csv
rm *.cd1
for f in *.pro ; do nodejs gparsnip "$f" ; done
