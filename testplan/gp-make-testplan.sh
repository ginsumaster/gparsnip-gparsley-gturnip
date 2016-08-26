#!/bin/bash
rm gp-*.htm?
rm gp-*.txt
rm gp-*.lst
rm gp-*.csv
rm gp-*.cd1
#
nodejs gparsnip gp-basic
nodejs gparsnip gp-meta
nodejs gparsnip gp-c
nodejs gparsnip gp-gc
nodejs gparsnip gp-soh
nodejs gparsnip gp-verbose
nodejs gparsnip gp-medley1
nodejs gparsnip gp-medley2
nodejs gparsnip gp-medley3
nodejs gparsnip gp-medley4
nodejs gparsnip gp-medley5
nodejs gparsnip gp-notitle
nodejs gparsnip gp-soh-hash
nodejs gturnip  gp-transpose1
nodejs gturnip  gp-transpose2
nodejs gturnip  gp-transpose3
