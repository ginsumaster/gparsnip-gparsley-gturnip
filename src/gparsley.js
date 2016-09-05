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
2016-09-05
modified key column to have individual letters in each column

2016-09-04
modified key column to maintain min space of 9 characters.

ALGORITHM:
1. read command line arguments, test for fitness
2. read in entire CSV file, test for validity
3. sort list of songs -- works, but not elegant, regexp not used.
4. Assemble and output htm file.

Features to add:
done error-checking process.argv, input file
done key of song displayed
done if click on TOC title, then download zip of website
done jump to line made just below subtitle
done if click on alphabet heading, jumps to top of web page
done fixed underline problem in 0chordlyric.css
numeric song titles, do numeric sort
Unicode

*/
var fs                    = require( 'fs' ); // read from filesystem
var in_file               = process.argv[ 2 ] + ".csv" ;
var in_file_buffer_length = 0;

var in_file_buffer        = [];    // CSV, tab-separated, Linux LF (\n) format
var in_file_buffer_index  = 0;
var in_file_buffer_length = 0;

var song_info_line        = "" ;
var song_array            = [];

const TOC_TITLE_DEFAULT   = "Songbook Table of Contents" ;
var TOC_SUBTITLE_DEFAULT  = new Date();
var toc_title             = process.argv[ 3 ] ;
var toc_subtitle          = process.argv[ 4 ] ;
const OUT_FILE_HTML       = "index.html" ; // table of contents
const OUT_FILE_ZIP        = "index.zip" ;  // user can download entire website

const OUT_FILE_HTML_CSS   = "0chordlyric.css" ;  // chord+lyrics css file
var html = [
  "<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"UTF-8\">\n<link rel=\"stylesheet\" type=\"text/css\" href=\"" ,
  "\">\n<style>\n<!--\na{text-decoration: none}\n-->\n</style>\n\n<title>" ,
  "</title>\n</head>\n\n<body>\n<h1><a href=\"0index.zip\" target=newtab>" ,
  "</a></h1>\n\n<h2>" ,
  "</h2><a name=\"0\"></a>\n" ,
  "\n\n</body>\n\n</html>\n"
];

const CSV_FORMAT = "title\tkey\ttime\tccli\tauthor\tcopyright\tmetronome\ttag\tfilename\n" ;

// mode 1 -- few comments; mode 2 -- heavy comments
//var DEBUGGING_MODE1 = true;
var DEBUGGING_MODE1 = false;
//var DEBUGGING_MODE2 = true;
var DEBUGGING_MODE2 = false;

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
  var out_file_buffer = [   html[ 0 ] + OUT_FILE_HTML_CSS
                          + html[ 1 ] + toc_title
                          + html[ 2 ] + toc_title
                          + html[ 3 ] + toc_subtitle
                          + html[ 4 ] ,
                          "<p>Go: " ,
                          "" ];
/*  [ 0 ] = beginning html, title, subtitle
    [ 1 ] = jumpto_string
    [ 2 ] = alphabet heading, songs, .. (repeat) .. ending html
*/
  var out_file_buffer_aggregate = "" ; // final out_file_buffer contents go here

  var song_array_length   = song_array.length;

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
 // heading_print is array of booleans, same size as heading[]
 // if true, then print corresponding heading[], false, don't print
  var heading_print = [] ;
  var heading_index = 0;
  var heading_length = heading.length;
  var i = 0;
  const KEY_MAX_LENGTH = 10;

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

  for ( k = 0; k < heading.length; k++ ) // insert headings into song database
    if ( heading_print[ k ] )
      song_array.push( heading[ k ] );

  song_array.sort();

  for ( k = 0; k < song_array.length; k++ ) { // remove headings
    song_line = song_array[ k ].toString();

    if ( song_line.length == 6 )
      if ( song_line == heading[ 0 ].toString() ) { // special 1st heading
          out_file_buffer[ 2 ] += "<h3> <a href=\"#0\">Misc</a></h3><a name=\"Misc\"></a>\n" ;
          out_file_buffer[ 1 ] += "<a href=\"#Misc\">Misc</a>" ; // jump to
        }
      else { // print regular header
        out_file_buffer[ 2 ] += "<h3><a href=\"#0\">  "   + song_line.charAt( 0 )
                             +  "  </a></h3><a name=\""   + song_line.charAt( 0 )
                             +  "\"></a>\n" ;

        // make jump to
        out_file_buffer[ 1 ] += "<a href=\"#" + song_line.charAt( 0 )
                             +  "\"> "        + song_line.charAt( 0 ) + " </a>" ;
      }
    else { // print info of this song
      song_title          = song_line.substring( 0, song_line.indexOf( "\t" ) );
      song_filename_noext = song_line.substring( song_line.lastIndexOf( "\t" ) );

      song_key_tmp = song_line.substring( song_line.indexOf( "\t" ) + 1 );
      song_key  = song_key_tmp.substring( 0, song_key_tmp.indexOf( "\t" ) );

      song_key = generate_song_key( song_key );

      out_file_buffer[ 2 ] +=
       '<p><a href="' + song_filename_noext + '.html" target=newtab> lyr </a>'
        + '<a href="' + song_filename_noext + '.txt"  target=newtab> txt </a>'
        + '<a href="' + song_filename_noext + '.lst"  target=newtab> lst </a>'
        + '<a href="' + song_filename_noext + '.pro"  target=newtab> pro </a>'
        + '<a href="' + song_filename_noext + '.htm"  target=newtab>' + song_key
        + " " + song_title + '</a></p><br>\n' ;
    } // else
  } // for k

  out_file_buffer[ 1 ] += "</p>\n" ; // jump to string line, complete
  out_file_buffer[ 2 ] += html[ 5 ]; // rest of html page, complete
  out_file_buffer_aggregate = out_file_buffer[ 0 ] + out_file_buffer[ 1 ] + out_file_buffer[ 2 ];

  fs.writeFileSync( OUT_FILE_HTML, out_file_buffer_aggregate );
} // function

////////////////////////////////////////////////////////////////////////////////
function generate_song_key( old_song_key ) {
  var Major_Scale =          [ 'A',   'B',   'C',  'D',  'E',   'F',  'G'  ];
  var Relative_Minor_Scale = [ 'F#m', 'G#m', 'Am', 'Bm', 'C#m', 'Dm', 'Em' ];
  var Minor_Scale =          [ 'Am',  'Bm',  'Cm', 'Dm', 'Em',  'Fm', 'Gm' ];

  var Major_Scale_TF =       [ false, false, false, false, false, false, false ];
  var Minor_Scale_TF =       [ false, false, false, false, false, false, false ];

  const SONG_KEY_CHARACTER_LENGTH = 8;
  const KEYS_IN_SCALE      = 7; // "A" .. "G"

  const SCALE_UNDETERMINED = -1;
  const SCALE_MAJOR        =  0;
  const SCALE_MINOR        =  1;
  const SCALE_VERBOSE      =  2;

  var scale_to_print = SCALE_UNDETERMINED;
  var song_key_str   = "";
  var displaying_minor_key = false;

  var i = 0;
  var j = 0;
  var k = 0;
  var max_i = old_song_key.length;

  do {

    j = 0;
    do {

      if ( old_song_key[ i ].toString() == Major_Scale[ j ].toString() )
        if ( ( i + 1 ) < max_i )
          if ( old_song_key[ i + 1 ].toString() == "m" ) {
            for ( k = 0; k < KEYS_IN_SCALE; k++ )
              if ( old_song_key[ i ].toString() == Major_Scale[ k ].toString() )
                {  // minor key found
                  Minor_Scale_TF[ k ] = true;
                  scale_to_print = SCALE_MINOR;
                }
              else {}
          }
          else
            for ( k = 0; k < KEYS_IN_SCALE; k++ )
              if ( old_song_key[ i ].toString() == Major_Scale[ k ].toString() )
                { // major key found
                  Major_Scale_TF[ k ] = true;
                  if ( scale_to_print == SCALE_UNDETERMINED )
                    scale_to_print = SCALE_MAJOR;
                }
              else {}
        else
          if ( ( i + 1 ) == max_i ) // key string is: "A" or "..A"
            for ( k = 0; k < KEYS_IN_SCALE; k++ )
              if ( old_song_key[ i ].toString() == Major_Scale[ k ].toString() )
                { // major key found
                  Major_Scale_TF[ k ] = true;
                  if ( scale_to_print == SCALE_UNDETERMINED )
                    scale_to_print = SCALE_MAJOR;
                }
              else {}
          else {}
      else {}

      j++;
    }
    while ( j < KEYS_IN_SCALE );

    i++;
  }
  while ( i < max_i );

if ( DEBUGGING_MODE2 ) {
  console.log( "M:", Major_Scale_TF );
  console.log( "m:", Minor_Scale_TF );
  console.log( "scale to print:", scale_to_print );
}

  switch ( scale_to_print ) {

    case SCALE_MAJOR :
      for ( k = 0; k < KEYS_IN_SCALE; k++ )
        if ( Major_Scale_TF[ k ] == true )
          song_key_str += Major_Scale[ k ].toString();
        else
          song_key_str += " " ;
      break;

    case SCALE_MINOR :
      for ( k = 0; k < KEYS_IN_SCALE; k++ )
        if ( Minor_Scale_TF[ k ] == true ) {
          song_key_str += Minor_Scale[ k ].toString();
          displaying_minor_key = true;
        }
        else
          if ( displaying_minor_key )
            displaying_minor_key = false;
          else
            song_key_str += " " ;
      break;

    case SCALE_UNDETERMINED : song_key_str = "       " ; break; // feature not used

    case SCALE_VERBOSE : song_key_str = old_song_key; // feature not implemented
                         for ( k = ( SONG_KEY_CHARACTER_LENGTH - old_song_key.length );
                               k < SONG_KEY_CHARACTER_LENGTH; k++ )
                            song_key_str += " ";
    default: break;

  } // switch

   return( song_key_str );

if ( DEBUGGING_MODE2 ) console.log( "song_key_str:", song_key_str, "*" );
}
