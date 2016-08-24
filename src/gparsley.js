/*******************************************************************************
GParsley -- Table of Contents (html) Generator ( used w/ GParsnip )

SUMMARY: This program creates a web page table of contents from a song data csv
  The song data csv is generated from combining GParsnip csv outputs.

PHILOSOPHY: Do it (W)RIGHT, Do it Once

TO RUN:
# ls
gparsley.js  index.csv
# nodejs gparsley index "Title" "Subtitle"

INPUT:
index.csv  all songs you want to be included in the table of contents
          ( Unix/Linux LF style, UTF-8 encoded, comma-delimited )

OUTPUT:
index.html -- TOC of all songs.  Use your web browser to open.

NOTE: index.html's title will attempt to download 0index.zip --
  zipped up version of the entire website.

LANGUAGE:  JavaScript ( requiring Nodejs )

LICENSING: MIT License
Copyright (c) 2016 Daniel Ho

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

NOTES:

ALGORITHM:
1. read command line arguments, test for fitness
2. read in entire CSV file, test for validity
3. sort list of songs -- works, but not elegant, regexp not used.
4. Assemble and output htm file.

Features to add:
done error-checking process.argv, input file
done key of song displayed
done if click on TOC title, then download zip of website
numeric song titles, do numeric sort
Unicode

*/
var fs                    = require( 'fs' ); // read from filesystem
//var in_file_noext         = process.argv[ 2 ] ;
var in_file               = process.argv[ 2 ] + ".csv" ;
var in_file_buffer_length = 0;

var in_file_buffer        = "" ;    // CSV, tab-separated, Linux LF (\n) format
var in_file_buffer_index  = 0;
var in_file_buffer_length = 0;

var song_info_line        = "" ;
var song_array            = [];

const TOC_TITLE_DEFAULT   = "Songbook Table of Contents" ;
//const TOC_SUBTITLE_DEFAULT = "2016" ;
var TOC_SUBTITLE_DEFAULT  = new Date();
var toc_title             = process.argv[ 3 ] ;
var toc_subtitle          = process.argv[ 4 ] ;
//var out_file_html         = process.argv[ 2 ] + ".html" ;
//var out_file_html         = "index.html" ;
const OUT_FILE_HTML       = "index.html" ; // table of contents
const OUT_FILE_ZIP        = "index.zip" ; // user can download entire website

const OUT_FILE_HTML_CSS   = "0chordlyric.css" ;  // chord+lyrics css file
var html = [
  "<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"UTF-8\">\n<link rel=\"stylesheet\" type=\"text/css\" href=\"" ,
  "\">\n<style>\n</style>\n\n<title>" ,
  "</title>\n</head>\n\n<body>\n<h1><a href=\"0index.zip\" target=newtab>" ,
  "</a></h1>\n\n<h2>" ,
  "</h2>\n" ,
  "\n\n</body>\n\n</html>\n"
];

const CSV_FORMAT = "title\tkey\ttime\tccli\tauthor\tcopyright\tmetronome\ttag\tfilename\n" ;

////////////////////////////////////////////////////////////////////////////////
// Main program here
if ( fs.existsSync( in_file ) ) { //csv source file
  in_file_buffer = fs.readFileSync( in_file, 'utf8' ); // critical utf8 parameter
  in_file_buffer_length = in_file_buffer.length;

  // read song data into array
  for ( in_file_buffer_index = 0;
        in_file_buffer_index < in_file_buffer_length;
        in_file_buffer_index++ )
    if ( in_file_buffer[ in_file_buffer_index ] == "\n" ) {
      song_array.push( song_info_line );
      song_info_line = "" ;
    } else
      song_info_line += in_file_buffer[ in_file_buffer_index ];

  if ( typeof toc_title === "undefined" )
    toc_title = TOC_TITLE_DEFAULT;

  if ( typeof toc_subtitle === "undefined" )
    toc_subtitle = TOC_SUBTITLE_DEFAULT;
  else
    toc_subtitle += "  " + TOC_SUBTITLE_DEFAULT;

  generate_song_html();

} else
  console.log( "Can't find input file:", in_file );

////////////////////////////////////////////////////////////////////////////////
function generate_song_html() {
  var out_file_buffer = html[ 0 ] + OUT_FILE_HTML_CSS
                      + html[ 1 ] + toc_title
                      + html[ 2 ] + toc_title
                      + html[ 3 ] + toc_subtitle
                      + html[ 4 ] ;
  var song_array_length = song_array.length;

  var song_line           = "" ; // one line of csv

  var song_title          = "" ;
  var song_filename_noext = "" ;
  var song_key            = "" ;

  var song_key_tmp        = "" ;

  var k;
  var j;
  var heading = [ "0    !" , "A    !" , "B    !" , "C    !" , "D    !" ,
       "E    !" , "F    !" , "G    !" , "H    !" , "I    !" , "J    !" ,
       "K    !" , "L    !" , "M    !" , "N    !" , "O    !" , "P    !" ,
       "Q    !" , "R    !" , "S    !" , "T    !" , "U    !" , "V    !" ,
       "W    !" , "X    !" , "Y    !" , "Z    !" , "zzzzzz" ];
 // array of booleans, same size as heading[]
 // if true, then print corresponding heading[], false, don't print
  var heading_print = [] ;
  var heading_index = 0;
  var heading_length = heading.length;

//  var heading_index = 0;
//  var current_heading_printed = false;


  for ( k = 0; k < heading.length; k++ ) // initialize, print no headings
    heading_print.push( false );

  song_array.sort(); // first sort is w/o headings inserted

  j_lowest = 0;
  for ( k = 0; k < song_array.length; k++ ) {// find out if heading needed
    j = j_lowest;

    while ( j < ( heading_length - 1 ) ) {
      if ( ( heading[ j ].toString() < song_array[ k ].toString() )  &&
           ( song_array[ k ].toString() < heading[ j + 1 ].toString()  ) ) {
        heading_print[ j ] = true;
        j_lowest++
        break;
      } // if
      j++
    } // while j
  } // for k

/*
  for ( j = 0; j < ( heading.length - 1 ); j++ )
     if ( ( heading[ j ].toString() < song_array[ k ].toString() )  &&
          ( song_array[ k ].toString() < heading[ j + 1 ].toString()  ) )
       heading_print[ j ] = true;
*/


  for ( k = 0; k < heading.length; k++ ) // insert headings into song database
    if ( heading_print[ k ] )
      song_array.push( heading[ k ] );

  song_array.sort();

  for ( k = 0; k < song_array.length; k++ ) { // remove headings
    song_line = song_array[ k ].toString();

    if ( song_line.length == 6 )
      if ( song_line == heading[ 0 ].toString() )
        out_file_buffer += "<h3>Misc</h3>\n" ; // print first header
      else // print regular header
        out_file_buffer += "<h3>" + song_line.charAt( 0 ) + "</h3>\n" ;
    else { // print info of this song
      song_title = song_line.substring( 0, song_line.indexOf( "\t" ) );
      song_filename_noext = song_line.substring( song_line.lastIndexOf( "\t" ) );

      song_key_tmp = song_line.substring( song_line.indexOf( "\t" ) + 1 );
      song_key = song_key_tmp.substring( 0, song_key_tmp.indexOf( "\t" ) );

      out_file_buffer +=
          '<p> <a href="' + song_filename_noext + '.html" target=newtab>lyr</a> </p> '
        + '<p> <a href="' + song_filename_noext + '.txt" target=newtab>txt</a> </p> '
        + '<p> <a href="' + song_filename_noext + '.lst" target=newtab>lst</a> </p> '
        + '<p> <a href="' + song_filename_noext + '.pro" target=newtab>pro</a> </p> '
        + '<p> <a href="' + song_filename_noext + '.htm" target=newtab>' + song_key + '</a> </p>\n'
        + '<p> <a href="' + song_filename_noext + '.htm" target=newtab>'
//        + song_filename_noext + "</a> </p><br>\n" ;
        + song_title + "</a> </p><br>\n" ;

    } // else

  } // for k

  out_file_buffer += html[ 5 ];
  fs.writeFileSync( OUT_FILE_HTML, out_file_buffer );
} // function
