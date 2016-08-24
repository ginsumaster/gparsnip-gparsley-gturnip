/*******************************************************************************
GParsnip -- ChordPro Generator Parser

SUMMARY: Program takes a ChordPro -encoded plain text file
  and generates musician-ready formatted text and html files.

  Combined with a second program, gparsley, you can easily generate an entire
  table of contents / website of your songs -- quickly and easily.

PHILOSOPHY: Do it (W)RIGHT, Do it Once

TO RUN:
# ls
gparsnip.js  song.pro
# nodejs gparsnip song             OR              # nodejs gparsnip song.pro

INPUT:
song.pro  ( Unix/Linux LF style, UTF-8 encoded)

OUTPUTS:
  1. song.txt       ( chord over lyric, plain text )
  2. song.htm       ( chord over lyric, html, **needs 0chordlyrics.css )
  3. song.lst       ( lyrics only, plain text )
  4. song.html      ( lyrics only, html, ** needs 0lyricsonly.css )
  5. song.csv       ( "database" of song's info: tab-delimited csv text file )
  6. 0gparsnip.csv  ( tab-delimited csv text file -- headings only )
  7. song.cd1       ( space-delimited list of chords used in song )

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

FEATURES:
1. Major meta-tags recognized:
{title:} {subtitle:} {key:} {time:} {ccli:} {author:} {copyright:} {comment:}
{guitar-comment:} {metronome:} {tag:} {soh} {eoh}

2. Readability algorithms instituted:
  a. Standard font is mono-spaced for better chord over lyric alignment.
  b. Chords crowding avoided -- always two spaces between chords.
  c. Lyric crowdind avoided -- dashes inserted automatically, when needed.

3. New ChordPro extensions implemented:
  a. {soh} and {eoh} meta-tags to section off musical passages.
  b. #st-comment meta-tag -- put comments in subtitle
  c. "Verbose chord line", i.e. lines starting with '|' to handle instr, intro
  d. Auto-generation of subtitle based on meta tags:
     {key:} {time:} {ccli:} {author:} {copyright:} and #st-comment
  e. Auto-generation of .csv and .cd1 files
     1. .csv file is for .xls creation and TOC (index.html) generation.
     2. .cd1 file for utility to transpose/substitute chords
  f. Medley song handling -- 2 songs, 2-3 titles, 2-3 subtitles

4. Extensive test plan, regression testing scripts

NOTES: version 44
Bpm now appears in subtitle line.
Found bug in lyric-handling, "Above All [A]", vss 1, line 3, "man-"

optional -- fix soh eoh error handling routines

1. My remove_double_spaces() routine doesn't work right.  Get a runtime error.
So I skipped it.  Therefore if source file has double spaces, my program
will not eliminate them.  One workaround is usind css file to remove them.
error:
remove_double_spaces( out_buffer_lyrics_only[ song_index ].toString() );
TypeError: Cannot read property 'toString' of undefined

2. I wanted to use a regular expression in one function, but failed.
Made workaround instead.

////////////////////////////////////////////////////////////////////////////////
/* Possible future feature -- valid chord character enforcement
//keys A..B, #, b, M, m, aug, dim, sus, Maj, min, 2, 3, 4, 7, 11, 13, no, ()
const VALID_CHORD_CHARS = "ABCDEFG#bmMaugdisujn23471o()"; // currently not enforced
const VALID_LYRIC_CHARS = "abcsfghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ()!";
const VALID_SUBSET_UTF8_CHARS =
"\n !\"#$%&\'()*+,-./0123456789O:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~" ;
*******************************************************************************/
////////////////////////////////////////////////////////////////////////////////
// input -- .pro file -- chordpro formatted plain text file
var fs                    = require( 'fs' ); // read from filesystem
var in_file_noext         = process.argv[ 2 ] ;
var in_file_pro           = process.argv[ 2 ] + ".pro" ; //chordpro source file
var in_file_buffer        = "" ;  // input chordpro file, entire contents
var in_file_buffer_index  = 0;    // format of file is Linux LF (\n) format
var in_file_buffer_length = 0;
var in_line               = "" ; // 1 line -- input chordpro string
var i                     = 0;   // in_line[ i ]
var in_line_length        = 0;   // in_line.length

////////////////////////////////////////////////////////////////////////////////
// increments w/ each meta_tag_title found: range: 0,1,2 -- out_buffer_XX
var song_index = 0;

////////////////////////////////////////////////////////////////////////////////
// output -- .txt -- processed chord over lyrics plain text file
const DEFAULT_SONG_TITLE    = "Untitled Song" ;
var out_file_chord_lyrics   = process.argv[ 2 ] + ".txt" ; // chord+lyrics file
var out_buffer_chord_lyric = [ "" , "" , "" , "" ]; // ALL out_line_chord and out_line_lyric into here
var out_line_chord          = "" ;          // 1 line -- output chord line
var out_line_lyric          = "" ;          // 1 line -- output lyric line

////////////////////////////////////////////////////////////////////////////////
// output -- .lst -- processed lyrics-only plain text file
var out_file_lyrics        = process.argv[ 2 ] + ".lst" ; // lyric-only file
var out_buffer_lyrics_only = [ "" , "" , "" , ""]; // buffer -- lyrics only version of chordpro file
var out_line_lyrics_only   = "" ; // lyrics-only line
var skip_lyrics_only_line_processing = false;

////////////////////////////////////////////////////////////////////////////////
// output -- .htm -- processed chord over lyrics html w/ css
var html = [
  "<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"UTF-8\">\n<link rel=\"stylesheet\" type=\"text/css\" href=\"" ,
  "\">\n<style>\n</style>\n\n<title>" ,
  "</title>\n</head>\n\n<body>\n<h1>" ,
  "</h1>\n\n<h2>" ,
  "</h2>\n" ,
  "\n\n</body>\n\n</html>\n"
];
const OUT_FILE_HTML_CSS           = "0chordlyric.css" ;  // chord+lyrics css file
var   out_file_html               = process.argv[ 2 ] + ".htm" ; // chord+lyrics html ver
var   out_buffer_html_chord_lyric = [ "" , "" , "" , "" ];
var   out_line_html_chord         = "<h6>" ;
var   out_line_html_lyric         = " <p>" ;

////////////////////////////////////////////////////////////////////////////////
// output -- .html -- processed lyrics-only web page w/ css
//const OUT_FILE_HTML_LYRICS_ONLY_CSS = "chordlyric.css" ;  // chord+lyrics css file
const OUT_FILE_HTML_LYRICS_ONLY_CSS = "0lyricsonly.css" ;    // lyrics only css file
var   out_file_html_lyrics_only     = process.argv[ 2 ] + ".html" ;
var   out_buffer_html_lyrics_only   = [ "" , "" , "" , "" ];
var   out_line_html_lyrics_only     = "<p>" ;

////////////////////////////////////////////////////////////////////////////////
// main process_line() function - parsing mode
const PARSE_UNDEFINED    = 0;
const PARSE_META_TAG     = 10;
const PARSE_CHORD        = 20;
const PARSE_LYRIC        = 30;
const PARSE_EXIT         = 99;
var   parse_mode         = PARSE_UNDEFINED;
var   last_parse_mode    = PARSE_UNDEFINED;
var   parse_string       = "";

// while doing processing of token, need to know what was previously processed
const PARSE_LYRIC_NON_SPACE         = 32;
const PARSE_LYRIC_SPACE             = 31;
const PARSE_META_TAG_COMMENT        = 11;
const PARSE_META_TAG_GUITAR_COMMENT = 12;
var   last_parse_mode_flag          = PARSE_UNDEFINED;
var   last_parse_string_length      = -1;

var j = 0;  // length of current musical chord being processed, no brackets

////////////////////////////////////////////////////////////////////////////////
// meta-tag data arrays and vars
var meta_tag_title                = [] ; // 3 max
var meta_tag_subtitle             = [] ; // 2 max
// lyrics-only version of subtitle omits some info from standard subtitle
var meta_tag_subtitle_lyrics_only = [] ; // 2 max
var meta_tag_key                  = [] ; // 2 max
var meta_tag_time                 = [] ; // 2 max
var meta_tag_ccli                 = [] ; // 2 max
var meta_tag_author               = [] ; // 2 max
var meta_tag_copyright            = [] ; // 2 max
var meta_tag_first_copyright      = [ "" , "" ] ; // 2 max -- created from copyright
// new meta_tags for CSV/database compilation
var meta_tag_metronome            = [] ; // bpm
var meta_tag_tag                  = [] ; // search strings

                                    // meta-tag processing
var meta_tag_term             = "" ;
var meta_tag_argument         = "" ; // everything after ":"
var meta_tag_argument_trimmed = "" ; // as above, no leading, trailing spaces
var meta_tag_argument_length  = -1;
                                   // variables for handling soh and eoh
var meta_tag_soh_count        = 0;
var meta_tag_eoh_count        = 0;
var in_line_last_soh_index   = -1; // last position of last found {soh}
var in_line_last_eoh_index   = -1; // last position of last found {soh}

////////////////////////////////////////////////////////////////////////////////
// CSV-database vars
const CSV_FORMAT_FILE        = "0gparsnip.csv" ;  // chord+lyrics css file
const CSV_FORMAT = "title\tkey\ttime\tccli\tauthor\tcopyright\tmetronome\ttag\tfilename\n" ;

var out_file_csv = process.argv[ 2 ] + ".csv" ;

////////////////////////////////////////////////////////////////////////////////
// meta-tag processing for #chords: #chords-new: #st-comment
var comment_st_comment = [] ;  // comments for subtitle only, 3 max

////////////////////////////////////////////////////////////////////////////////
var chord_list          = [] ; // keep track of all chords used in song
var final_chord_string  = "" ; // list of chords used, space-delimited, no [ ]
var out_file_chord_list = process.argv[ 2 ] + ".cd1" ;

// mode 1 -- few comments; mode 2 -- heavy comments
//var DEBUGGING_MODE1 = true;
var DEBUGGING_MODE1 = false;
//var DEBUGGING_MODE2 = true;
var DEBUGGING_MODE2 = false;

////////////////////////////////////////////////////////////////////////////////
// **** Main Processing Program Here ****
////////////////////////////////////////////////////////////////////////////////
if ( fix_filenames() ) {
  in_file_buffer = fs.readFileSync( in_file_pro, 'utf8' ); // critical utf8 parameter
  in_file_buffer_length = in_file_buffer.length;

  if ( test_input_buffer() ) { // process entire input file, 1 line at a time
    for ( in_file_buffer_index = 0;
          in_file_buffer_index < in_file_buffer_length;
          in_file_buffer_index++ )
      if ( in_file_buffer[ in_file_buffer_index ] == "\n" ) {

        in_line_length = in_line.length;

        out_line_chord       = "" ;
        out_line_lyric       = "" ;
        out_line_lyrics_only = "" ;

        out_line_html_chord        = "<h6>" ;
        out_line_html_lyric        = " <p>" ;
        out_line_html_lyrics_only  = "<p>"  ;

        meta_tag_soh_count = 0;  in_line_last_soh_index = -1;
        meta_tag_eoh_count = 0;  in_line_last_eoh_index = -1;

        process_line();
        output_lines();

        in_line = "" ;
      } // if in_file_buffer
      else
         in_line += in_file_buffer[ in_file_buffer_index ];
  } // if test_input_buffer

  output_results();

} // if fix_filenames

////////////////////////////////////////////////////////////////////////////////
function process_line() {
// process one entire line of an input chordpro string
  skip_lyrics_only_line_processing = false;

  if ( in_line_length == 0   ) {  process_blank_line();         return;
  } else
  if (   in_line[ 0 ] == "#" ) {  process_comment_line();       return;
  } else
  if (   in_line[ 0 ] == "|" ) {  process_verbose_chord_line(); return;
  }

  i = 0;
  last_parse_mode = PARSE_UNDEFINED;
  parse_mode      = PARSE_UNDEFINED;

  while ( parse_mode != PARSE_EXIT ) {

if ( DEBUGGING_MODE2 )  console.log( "process_line() -- parsing mode is:", parse_mode );

    switch ( parse_mode ) {

      case PARSE_UNDEFINED :
        parse_string = "";

        if ( in_line[ i ] == "{" ) { parse_mode = PARSE_META_TAG;        i++;
        } else
        if ( in_line[ i ] == "[" ) { parse_mode = PARSE_CHORD;           i++;
        } else                       parse_mode = PARSE_LYRIC;
        break;

      case PARSE_META_TAG :
        if ( in_line[ i ] == "}" ) { process_meta_tag();
/* in case meta-tag is invalid or meta-tag is like soh-soh (no printing)
                                     last_parse_mode = PARSE_META_TAG;
                                     last_parse_string_length = parse_string.length; */
                                     parse_mode      = PARSE_UNDEFINED;  i++;
        } else {
                                     parse_string += in_line[ i ];       i++;
        }
        break;

      case PARSE_CHORD :
        if ( in_line[ i ] == "]" ) { process_chord();
                                     last_parse_mode = PARSE_CHORD;
                                     last_parse_string_length = parse_string.length + 2; // 2 trailing spaces
                                     parse_mode      = PARSE_UNDEFINED;  i++;
        } else {
                                     parse_string += in_line[ i ];       i++;
        }
        break;

      case PARSE_LYRIC :
        if ( in_line[ i ] == "{" ) { process_lyric();
                                     last_parse_mode = PARSE_LYRIC;
                                     last_parse_string_length = parse_string.length;
                                     parse_mode      = PARSE_META_TAG;
                                     parse_string    = "";               i++;
        } else
        if ( in_line[ i ] == "[" ) {
                                     process_lyric();
                                     last_parse_mode = PARSE_LYRIC;
                                     last_parse_string_length = parse_string.length;
                                     parse_mode      = PARSE_CHORD;
                                     parse_string    = "";               i++;
        } else {
                                     parse_string += in_line[ i ];
                                     if ( in_line[ i ] == " " )
                                        last_parse_mode_flag = PARSE_LYRIC_SPACE;
                                     else
                                        last_parse_mode_flag = PARSE_LYRIC_NON_SPACE;
                                     i++;
        }
        break;

      case PARSE_EXIT :
      default                :
    } // switch

    if ( i >= in_line_length ) {
      switch ( parse_mode ) {
        case PARSE_META_TAG  : // end of line -- user forgot "}"
                               process_meta_tag(); break;
        case PARSE_CHORD     : // end of line -- user forgot "]"
                               process_chord();    break;
        case PARSE_LYRIC     : // line ends w/ lyrics, have to process
                               process_lyric();    break;
        case PARSE_UNDEFINED : // line properly ends with "}" or "]"
        case PARSE_EXIT      :
        default              : {}
      } // switch

      parse_mode = PARSE_EXIT;

    } // if

  } // while
} // function

////////////////////////////////////////////////////////////////////////////////
function process_blank_line() {
// nothing in current line -- in_line string empty
  out_buffer_chord_lyric[ song_index ]     += "\n" ;
  out_buffer_lyrics_only[ song_index ]      += "\n" ;
  out_buffer_html_chord_lyric[ song_index ] += "<br>\n";
  out_buffer_html_lyrics_only[ song_index ] += "<br>\n";
}

////////////////////////////////////////////////////////////////////////////////
function process_comment_line() {
// if line starts with #, then the entire line is a comment.  Do not print line.
// however process new meta-tags: #st-comment:
  var colon_pos        = in_line.indexOf( ":" );
  var comment_term     = in_line.slice( 1, colon_pos );
  var comment_argument = trim_leading_spaces( in_line.slice( colon_pos + 1 ) );

  if ( ( colon_pos == 11 ) && ( comment_term == "st-comment") )
    comment_st_comment.push( comment_argument );
}

////////////////////////////////////////////////////////////////////////////////
function process_verbose_chord_line() {
// input line started with '|' character -- treat as literal chord line
// however, for apps needing search-and-replace, chords must be in [ ] in .pro file
  var k;

  for ( k = 0; k < in_line_length; k++ )
    if ( ( in_line[ k ] == "[" ) || ( in_line[ k ] == "]" ) )
      {}
    else out_line_chord += in_line[ k ];

  out_line_html_chord  = "<h6>" + out_line_chord + "</h6>\n";
  skip_lyrics_only_line_processing = true;
}

////////////////////////////////////////////////////////////////////////////////
function space_string( len ) {
// input # len; return string with len # of spaces in it
  var k;
  var str = "";

  for ( k = 0; k < len; k++ )
    str += " ";

  return str;
}

////////////////////////////////////////////////////////////////////////////////
function process_meta_tag() {
  var colon_pos                 = parse_string.indexOf( ":" );
  var meta_tag_argument_length  = -1;

  if ( colon_pos == -1 )
    if ( ( parse_string == "soh" ) || ( parse_string == "eoh" ) )
      meta_tag_term = parse_string;
    else return;
  else {
    meta_tag_term     = parse_string.substring( 0, colon_pos + 1 );
    meta_tag_argument = parse_string.substring( colon_pos + 1 );
    meta_tag_argument_length  = meta_tag_argument.length;
    meta_tag_argument_trimmed =
                trim_trailing_spaces( trim_leading_spaces( meta_tag_argument ) );
  }

if ( DEBUGGING_MODE2 ) {
console.log( "process_meta_tag() -- meta_tag_term:", meta_tag_term, "*" );
console.log( "process_meta_tag() -- argument   is:", meta_tag_argument, "*" );
console.log( "process_meta_tag()    arg length is:", meta_tag_argument.length ); }

  switch ( meta_tag_term ) {
    case "title:"    :
    case "t:"        :  meta_tag_title.push( meta_tag_argument_trimmed );
                        song_index++ ; // select next buffer for chord/lyrics
                        break;
    case "subtitle:"  :
    case "st:"        :
    case "su:"        :  meta_tag_subtitle.push( meta_tag_argument_trimmed );  break;
    case "key:"       :
    case "k:"         :  meta_tag_key.push( meta_tag_argument_trimmed );       break;
    case "time:"      :  meta_tag_time.push( meta_tag_argument_trimmed );      break;
    case "ccli:"      :  meta_tag_ccli.push( meta_tag_argument_trimmed );      break;
    case "author:"    :  meta_tag_author.push( meta_tag_argument_trimmed );    break;
    case "copyright:" :  meta_tag_copyright.push( meta_tag_argument_trimmed ); break;

    case "comment:"        :
    case "c:"              :
    case "comment_bold:"   :
    case "cb:"             :
    case "comment_italic:" :
    case "ci:"             :  process_meta_tag_comment();        break;

    case "guitar_comment:" :
    case "gc:"             :  process_meta_tag_guitar_comment(); break;

    case "soh"             :  process_meta_tag_soh();            break;
    case "eoh"             :  process_meta_tag_eoh();            break;

    case "metronome:" :  meta_tag_metronome.push( meta_tag_argument_trimmed ); break;

    case "tag:"       :  meta_tag_tag.push( meta_tag_argument_trimmed );       break;
    default: {} // unrecognized meta-tag, no processing, no mod parse flags
  } // switch

if ( DEBUGGING_MODE1 ) {
console.log( "/*----------------- process_meta_tag()" );
console.log( out_line_chord, "##" );
console.log( out_line_lyric, "##" );
console.log( out_line_html_lyrics_only, "##" );
console.log( "*/----------------- process_meta_tag()" );  }

} // function

////////////////////////////////////////////////////////////////////////////////
function process_chord() {
  var spacey_string = "";
  var chord_lyric_line_gap = 0;

  chord_list.push( parse_string );  // add chord to list

if ( DEBUGGING_MODE2 ) {
console.log( "process_chord() -           chord is:", parse_string, "*" );
console.log( "process_chord() - last_parse_mode is:", last_parse_mode ); }

  switch ( last_parse_mode ) {
    case PARSE_UNDEFINED :
    case PARSE_META_TAG  :
    case PARSE_CHORD     : out_line_chord      += parse_string + "  ";
                           out_line_html_chord += parse_string + "  ";
                           break;
    case PARSE_LYRIC     :
    default              :
      if ( last_parse_mode_flag == PARSE_LYRIC_NON_SPACE ) {
        chord_lyric_line_gap = out_line_chord.length - out_line_lyric.length;

        if ( chord_lyric_line_gap > 0 ) { // chord line longer than lyric line
          out_line_lyric      += "-" + space_string( chord_lyric_line_gap -1 );
          out_line_html_lyric += "-" + space_string( chord_lyric_line_gap -1 );

          out_line_chord      += parse_string + "  " ;
          out_line_html_chord += parse_string + "  " ;
        } else { // gap is <= 0, i.e. chord line shorter than lyric line
          spacey_string = space_string( out_line_lyric.length - out_line_chord.length );
          out_line_chord      += spacey_string + parse_string + "  ";
          out_line_html_chord += spacey_string + parse_string + "  ";
        } // else if

      } else { // last_parse_mode_flag == PARSE_LYRIC_SPACE
        spacey_string = space_string( out_line_lyric.length - out_line_chord.length );
        out_line_chord      += spacey_string + parse_string + "  ";
        out_line_html_chord += spacey_string + parse_string + "  ";
      } // else if
      //break;
  } // switch

if ( DEBUGGING_MODE1 ) {
console.log( "/*----------------- process_chord()" );
console.log( out_line_chord, "##" );
console.log( out_line_lyric, "##" );
//console.log( out_line_html_lyrics_only, "##" );
console.log( "*/----------------- process_chord()" );  }

} // function

////////////////////////////////////////////////////////////////////////////////
function process_lyric() {
  var chord_lyric_line_gap = -1;
  var spacey_string        = "";

if ( DEBUGGING_MODE2 ) {
console.log( "process_lyric()             lyric is:", parse_string, "*" );
console.log( "process_lyric()      lyric.length is:", parse_string.length );
console.log( "process_lyric()      last_parse_mode:", last_parse_mode );
console.log( "process_lyric() last_parse_mode_flag:", last_parse_mode_flag ); }

  switch ( last_parse_mode ) {

    case PARSE_META_TAG :
      if ( parse_string[ 0 ] == " " ) { // have to even-up chord line and lyric line
        spacey_string = space_string( out_line_chord.length
                                    - out_line_lyric.length );
        out_line_lyric            += spacey_string + parse_string;
        out_line_html_lyric       += spacey_string + parse_string;
        out_line_lyrics_only      +=                 parse_string;
        out_line_html_lyrics_only +=                 parse_string;

        out_line_chord      += parse_string;
        out_line_html_chord += parse_string;
      }
      break;

    case PARSE_CHORD :
      if ( parse_string[ 0 ] == " " ) { // chord line > lyric line
        chord_lyric_line_gap = out_line_chord.length - 2 - out_line_lyric.length;
        out_line_lyric      +=   space_string( chord_lyric_line_gap )
                               + parse_string;
        out_line_html_lyric +=   space_string( chord_lyric_line_gap )
                               + parse_string;

        out_line_lyrics_only       += parse_string;
        out_line_html_lyrics_only  += parse_string;
      } else {
         chord_lyric_line_gap =  out_line_chord.length
                               - last_parse_string_length // last chord length
                               - out_line_lyric.length;
         if ( chord_lyric_line_gap > 0 )
           spacey_string = space_string( chord_lyric_line_gap );
/*
           if ( last_parse_mode_flag == PARSE_LYRIC_NON_SPACE )
             spacey_string = space_string( chord_lyric_line_gap );
           else  // last_parse_mode == PARSE_LYRIC_SPACE
             spacey_string = "*" + space_string( chord_lyric_line_gap -1 );
*/
         out_line_lyric            += spacey_string + parse_string;
         out_line_html_lyric       += spacey_string + parse_string;
         out_line_html_lyrics_only +=                 parse_string;
         out_line_lyrics_only      +=                 parse_string;
      }
      break;

    case PARSE_LYRIC :
    default                 :  out_line_lyric            += parse_string;
                               out_line_lyrics_only      += parse_string;
                               out_line_html_lyrics_only += parse_string;
                               out_line_html_lyric       += parse_string;
  } // switch

if ( DEBUGGING_MODE1 ) {
console.log( "/*----------------- process_lyric()" );
console.log( out_line_chord, "##" );
console.log( out_line_lyric, "##" );
//console.log( out_line_html_lyrics_only, "##" );
console.log( "*/----------------- process_lyric()" );  }

} // function

////////////////////////////////////////////////////////////////////////////////
function process_meta_tag_guitar_comment() {
// meta-tag -- guitar comment
  var spacey_string = "";

  switch ( last_parse_mode ) {

    case PARSE_CHORD :
      out_line_chord      +=               meta_tag_argument;
      out_line_html_chord += "</h6><h5>" + meta_tag_argument + "</h5><h6>" ;
      break;

    case PARSE_UNDEFINED :
    case PARSE_META_TAG :
    case PARSE_LYRIC :
      if ( last_parse_mode_flag == PARSE_LYRIC_SPACE ) {
        spacey_string = space_string(   out_line_lyric.length
                                      - out_line_chord.length );
        out_line_chord      += spacey_string + meta_tag_argument;
        out_line_html_chord +=
                 "</h6><h5>" + spacey_string + meta_tag_argument + "</h5><h6>" ;
      } else
      if ( last_parse_mode_flag == PARSE_LYRIC_NON_SPACE ) {
        spacey_string = space_string(  out_line_lyric.length
                                     - out_line_chord.length );

        out_line_chord      += spacey_string + meta_tag_argument;
        out_line_html_chord +=
                 "</h6><h5>" + spacey_string + meta_tag_argument + "</h5><h6>" ;
       } else {
         out_line_chord      +=               meta_tag_argument;
         out_line_html_chord += "</h6><h5>" + meta_tag_argument + "</h5><h6>" ;
       }

      break;
    default :

  } // switch

  last_parse_mode          = PARSE_META_TAG;
  last_parse_mode_flag     = PARSE_META_TAG_GUITAR_COMMENT;
  last_parse_string_length = parse_string.length;
} // function

////////////////////////////////////////////////////////////////////////////////
function process_meta_tag_comment() {
// meta-tag -- inline comment
  var k = 0;
  var spacey_string = "";

if ( DEBUGGING_MODE2 )  console.log( "process_meta_tag_comment()" );

  out_line_lyric                   += meta_tag_argument;
  out_line_html_lyric += "</p><h4>" + meta_tag_argument + "</h4><p>" ;

  spacey_string = space_string( out_line_lyric.length - out_line_chord.length );

  out_line_chord      += spacey_string;
  out_line_html_chord += spacey_string;

  last_parse_mode          = PARSE_META_TAG;
  last_parse_mode_flag     = PARSE_META_TAG_COMMENT;
  last_parse_string_length = parse_string.length;
}

////////////////////////////////////////////////////////////////////////////////
function process_meta_tag_soh() {
  out_line_html_lyric       += "</p><h4>" ;
  out_line_html_lyrics_only += "</p><h4>" ;

  meta_tag_soh_count++ ;

  if ( in_line_last_soh_index == -1 )
    in_line_last_soh_index = i - 4;
};

////////////////////////////////////////////////////////////////////////////////
function process_meta_tag_eoh() {
// handle {eoh} tag
  out_line_html_lyric       += "</h4><p>" ;
  out_line_html_lyrics_only += "</h4><p>" ;

  meta_tag_eoh_count++ ;
  in_line_last_eoh_index = i;
};

////////////////////////////////////////////////////////////////////////////////
function fix_filenames() {
/* input filename must be FILE.pro.  However, when calling gparsnip Program
normally call:     nodejs gparsnip FILE
now can also call: nodejs gparsnip FILE.pro
returns true or false (input file is found)
*/
  var in_file_string = process.argv[ 2 ] ;
  var in_file_name_full = "" ;
  var dot_pos = in_file_string.indexOf( "." );

  if ( ( in_file_string == "--help" ) || ( in_file_string == "" ) ) {
    console.log( "Usage: gparsnip FILE" );
    console.log( "Input:  FILE.pro is a plain text file, ChordPro info, utf8 encoded, Linux (LF) style." )
    console.log( "Output:" );
    console.log( "FILE.txt  (chord+lyrics)" );
    console.log( "FILE.lst  (lyrics only)" );
    console.log( "FILE.htm  (chord+lyrics, html)" );
    console.log( "FILE.html (lyrics only, html)" );
    console.log( "FILE.csv  (csv)" );
    return false;
  }

  if ( dot_pos >= 0 )
    if ( fs.existsSync( in_file_string ) ) { // then user used FILE.pro and file exists
      in_file_pro               = in_file_string;    // fix out_X filenames
      in_file_noext             = in_file_string.slice( 0, dot_pos );
      out_file_chord_lyrics     = in_file_noext + ".txt"  ;
      out_file_lyrics           = in_file_noext + ".lst"  ;
      out_file_html             = in_file_noext + ".htm"  ;
      out_file_html_lyrics_only = in_file_noext + ".html" ;
      out_file_csv              = in_file_noext + ".csv"  ;
      out_file_chord_list       = in_file_noext + ".cd1"  ;
      return true;
    } else { // user used FILE.pro, but can't find file
       console.log( "Can't find input file:", in_file_string );
       return false;
      }
  else {// user used FILE, have to test
    in_file_name_full = in_file_string + ".pro" ;
    if ( fs.existsSync( in_file_name_full ) )// file exists, all good
      return true;
    else {
        console.log( "Can't find input file:", in_file_string );
        return false;
    } // if ( fs.existsSync( in_file_name_full ) )
  } // else
} // function

////////////////////////////////////////////////////////////////////////////////
function test_input_buffer() {
// test in_file_buffer.  Only allowed characters are LF and [space .. tilde]
  var charcode = 0;   // decimal character code of input character
  var give_warning = false;
/* not sure which code is easier to understand or faster
  for ( in_file_buffer_index = 0; in_file_buffer_index < in_file_buffer_length;
        in_file_buffer_index++ )
   if ( VALID_SUBSET_UTF8_CHARS.search( in_file_buffer[ in_file_buffer_index ] ) < 0 )
      return false;
   if ( ( VALID_SUBSET_UTF8_CHARS.indexOf( in_file_buffer[ in_file_buffer_index ] ) ) < 0 )
      return false;
   return true;
*/
  for ( in_file_buffer_index = 0; in_file_buffer_index < in_file_buffer_length;
        in_file_buffer_index++ ) {
    charcode = in_file_buffer.charCodeAt( in_file_buffer_index );

    if ( charcode < 10 )
      give_warning = true;   // control codes
    else if ( charcode == 10 )
           {} // okay, LF
         else if ( charcode < 32 )
                give_warning = true;   // control codes
              else if ( charcode < 127 )
                     {} // okay, space .. tilde
                   else if ( charcode < 49824 )
                          give_warning = true; // control codes
                        else give_warning = true; // okay, but multi-byte char

    if ( give_warning ) {
      console.log( "Warning -- input file has possible characters which may cause problems:", in_file_pro );
      console.log( "Correct Format of chordpro FILE.pro: plain text, utf8, Linux LF style; char in [\" \" .. \"~\" ]" );
      console.log( "Character is probably a flat (b), sharp(#), or smart left/right single or double quote character." );
      console.log( "Character found has decimal code #:", charcode );
      return true;
    } // if

  } // for
  return true;
}

////////////////////////////////////////////////////////////////////////////////
function trim_leading_spaces( txt_line ) {
// trim leading spaces from input string
  var txt_line_length = txt_line.length;
  var k;

  for ( k = 0; k < txt_line_length; k++ )
    if ( txt_line[ k ] == " " )
      {}
    else
      break;

  return txt_line.substring( k );
}

////////////////////////////////////////////////////////////////////////////////
function trim_trailing_spaces( txt_line ) {
  // trim trailing spaces from line
  var k;
  var out_txt_line = txt_line;

  for ( k = out_txt_line.length - 1; k >= 0; k-- )
    if ( out_txt_line[ k ] == " " )
      out_txt_line = out_txt_line.slice( 0, k );
    else break;

  return out_txt_line;
}

////////////////////////////////////////////////////////////////////////////////
function trim_leading_trailing_spaces( txt_line ) {
  return trim_leading_spaces( trim_trailing_spaces( txt_line ) );
}

////////////////////////////////////////////////////////////////////////////////
function remove_double_spaces( txt_line ) {
  // remove any instance of two spaces next to each other -- replace w/ 1 space

  var out_txt_line = txt_line.replace( /\s\s/g, " " );

  return out_txt_line;
/*
  var txt_line_length = txt_line.length;
  var out_txt_line = "";
  var double_up = false;
  var k;

  for ( k = 0; k < txt_line_length; k++ )
    if ( double_up )
      if ( txt_line[ k ] == " " )
        {}
      else {
        double_up = false;
        out_txt_line += txt_line[ k ];
    } else
      if ( txt_line[ k ] == " " ) {
        out_txt_line += " ";
        double_up = true;
      } else
        out_txt_line += txt_line[ k ];

  return out_txt_line; */
}

////////////////////////////////////////////////////////////////////////////////
function output_lines() {
  // combine chord and lyric lines into final output stream
  var tmp_str = "" ;

if ( DEBUGGING_MODE2 ) console.log( "output_lines()" );

  out_line_chord            = trim_trailing_spaces( out_line_chord );
  out_line_lyric            = trim_trailing_spaces( out_line_lyric );
  out_line_lyrics_only      = trim_trailing_spaces( out_line_lyrics_only );

  out_line_html_chord       = trim_trailing_spaces( out_line_html_chord );
  out_line_html_lyric       = trim_trailing_spaces( out_line_html_lyric );
  out_line_html_lyrics_only = trim_trailing_spaces( out_line_html_lyrics_only );

  if ( out_line_chord.length == 0 )
    if ( out_line_lyric.length == 0 ) // no chord, no lyric -- do nothing
      {}
    else { // no chord, have lyric
      out_buffer_chord_lyric[ song_index ] +=
                                                 out_line_lyric         + "\n" ;
       out_buffer_lyrics_only[ song_index ] +=
                   trim_leading_trailing_spaces( out_line_lyrics_only ) + "\n" ;

      // check to see if this is a musical heading section
      if (    ( meta_tag_soh_count == 1 ) && ( meta_tag_eoh_count == 1 )
           && (   in_line_last_soh_index == 0 )
           && ( ( in_line_last_eoh_index + 1 ) == in_line_length ) ) {
         out_buffer_html_chord_lyric[ song_index ] +=
                                           "<h3>" + out_line_lyric + "</h3>\n" ;
         out_buffer_html_lyrics_only[ song_index ] +=
                                           "<h3>" + out_line_lyric + "</h3>\n" ;
      } else { // regular highlighted section
        out_buffer_html_chord_lyric[ song_index ] +=
                                      out_line_html_lyric       + "</p><br>\n" ;
        out_buffer_html_lyrics_only[ song_index ] +=
                                      out_line_html_lyrics_only + "</p><br>\n" ;
      }
    }
  else
    if ( out_line_lyric.length == 0 ) { // have chord, no lyric
      out_buffer_chord_lyric[ song_index ]     += out_line_chord + "\n" ;
      out_buffer_html_chord_lyric[ song_index ] += out_line_html_chord + "</h6><br>\n" ;

      if ( !skip_lyrics_only_line_processing )
        out_buffer_lyrics_only[ song_index ] += "\n" ;
    }
    else { // have chord, have lyric
      out_buffer_chord_lyric[ song_index ] +=
                                 out_line_chord + "\n" + out_line_lyric + "\n" ;
      out_buffer_lyrics_only[ song_index ] +=
                   trim_leading_trailing_spaces( out_line_lyrics_only ) + "\n" ;
      out_buffer_html_chord_lyric[ song_index ] += out_line_html_chord + "</h6><br>\n"
                                                 + out_line_html_lyric + "</p><br>\n" ;
      out_buffer_html_lyrics_only[ song_index ] +=
              trim_trailing_spaces( out_line_html_lyrics_only ) + "</p><br>\n" ;
    } // else

/*
  out_buffer_lyrics_only[ song_index ] =
//    remove_double_spaces( out_buffer_lyrics_only[ song_index ] );
    remove_double_spaces( out_buffer_lyrics_only[ song_index ].toString() );
//    out_buffer_lyrics_only[ song_index ] ;

  out_buffer_html_lyrics_only[ song_index ] =
//    remove_double_spaces( out_buffer_html_lyrics_only[ song_index ] );
    remove_double_spaces( out_buffer_html_lyrics_only[ song_index ].toString() );
//    out_buffer_html_lyrics_only[ song_index ] ;

  tmp_str = out_buffer_lyrics_only[ song_index ].toString();
  tmp_str = remove_double_spaces( tmp_str );
  out_buffer_lyrics_only[ song_index ] = tmp_str;

  tmp_str = out_buffer_html_lyrics_only[ song_index ].toString();
  tmp_str = remove_double_spaces( tmp_str );
  out_buffer_html_lyrics_only[ song_index ] = tmp_str;
*/
} // function

////////////////////////////////////////////////////////////////////////////////
function output_results() {
  const SONG_1_TITLE_0   =  0; // 1 song, no title
  const SONG_1_TITLE_1   =  1; // 1 song,  1 title
  const SONG_2_TITLE_2   =  2; // 2 songs, 2 titles
  const SONG_2_TITLE_3   =  3; // 2 songs, 3 titles -- 1st one is medley title
  var song_medley_status = meta_tag_title.length;
  var tmp_song_medley_status = 0;
  var k = 0;
  var file_buffer = ""; // do all file writes one time only

  if ( song_medley_status == SONG_1_TITLE_0 ) {
    meta_tag_title.push( DEFAULT_SONG_TITLE );
    tmp_song_medley_status = SONG_1_TITLE_1;
  } else
    tmp_song_medley_status = song_medley_status;

                                                 // chord list output
  prep_chord_list();
  fs.writeFileSync( out_file_chord_list, final_chord_string );

  prep_subtitle_tags();

  switch ( song_medley_status ) {
    case SONG_2_TITLE_3 :
    case SONG_2_TITLE_2 : create_subtitle( 2 );
    case SONG_1_TITLE_1 : create_subtitle( 1 );
    case SONG_1_TITLE_0 : create_subtitle( 0 );
    default : {}
  }

                                                 // handle CSV file output
file_buffer = "" ;

if ( song_medley_status == SONG_2_TITLE_3 ) { // medley title
    file_buffer =     meta_tag_title[ 0 ].toString()           + "\t"
                    + meta_tag_key[ 0 ].toString()             + "\t"
                    + meta_tag_time[ 0 ].toString()            + "\t"
                  /*+ meta_tag_ccli[ k ].toString()*/          + "\t"
                  /*+ meta_tag_author[ k ].toString()*/        + "\t"
                  /*+ meta_tag_copyright[ k ].toString()*/     + "\t"
                    + meta_tag_metronome[ 0 ].toString()       + "\t"
                    + meta_tag_tag[ 0 ].toString()             + "\t"
                    + in_file_noext                            + "\n" ;

    for ( k = 1; k < 3; k++ ) // song 1 and song 2
      file_buffer +=  meta_tag_title[ k ].toString()           + "\t"
                    + meta_tag_key[ k ].toString()             + "\t"
                    + meta_tag_time[ k ].toString()            + "\t"
                    + meta_tag_ccli[ k ].toString()            + "\t"
                    + meta_tag_author[ k ].toString()          + "\t"
                    + meta_tag_first_copyright[ k ].toString() + "\t"
                    + meta_tag_metronome[ k ].toString()       + "\t"
                    + meta_tag_tag[ k ].toString()             + "\t"
                    + in_file_noext                            + "\n" ;
  } else
    for ( k = 0; k < tmp_song_medley_status; k++ )
      file_buffer +=  meta_tag_title[ k ].toString()         + "\t"
                  + meta_tag_key[ k ].toString()             + "\t"
                  + meta_tag_time[ k ].toString()            + "\t"
                  + meta_tag_ccli[ k ].toString()            + "\t"
                  + meta_tag_author[ k ].toString()          + "\t"
                  + meta_tag_first_copyright[ k ].toString() + "\t"
                  + meta_tag_metronome[ k ].toString()       + "\t"
                  + meta_tag_tag[ k ].toString()             + "\t"
                  + in_file_noext                            + "\n" ;

  fs.writeFileSync( out_file_csv, file_buffer );
  fs.writeFileSync( CSV_FORMAT_FILE, CSV_FORMAT );

                                                 // chord-lyric text output
  file_buffer = "" ;

  if ( song_medley_status == SONG_2_TITLE_3 ) {
    file_buffer = meta_tag_title[ 0 ].toString()               + "\n" ;

    if ( comment_st_comment[ 0 ].toString() != "" )
      file_buffer +=   comment_st_comment[ 0 ].toString()      + "\n" ;

    for ( k = 1; k < 3; k++ )
      file_buffer +=   meta_tag_title[ k ].toString()             + "\n"
                     + meta_tag_subtitle[ k ].toString()          + "  "
                     + comment_st_comment[ k ].toString()         + "\n"
                     + out_buffer_chord_lyric[ k + 1 ].toString() ;
  } else
  if ( song_medley_status >= SONG_1_TITLE_1 )
    for ( k = 0; k < tmp_song_medley_status; k++ )
      file_buffer  +=  meta_tag_title[ k ].toString()          + "\n"
                     + meta_tag_subtitle[ k ].toString()       + "  "
                     + comment_st_comment[ k ].toString()      + "\n"
                     + out_buffer_chord_lyric[ k + 1 ].toString()        ;
  else // SONG_1_TITLE_0
    file_buffer  +=  meta_tag_title[ 0 ].toString()          + "\n"
                   + meta_tag_subtitle[ 0 ].toString()       + "  "
                   + comment_st_comment[ 0 ].toString()      + "\n"
                   + out_buffer_chord_lyric[ 0 ].toString()        ;

  fs.writeFileSync( out_file_chord_lyrics, file_buffer );

                                                 // lyric-only text output
  file_buffer = "" ;

  if ( song_medley_status == SONG_2_TITLE_3 ) {
    file_buffer = meta_tag_title[ 0 ].toString()                        + "\n" ;

    if ( comment_st_comment[ 0 ].toString() != "" )
      file_buffer += comment_st_comment[ 0 ].toString()                 + "\n" ;

    for ( k = 1; k < 3; k++ )
      file_buffer +=   meta_tag_title[ k ].toString()                    + "\n"
                     + meta_tag_subtitle_lyrics_only[ k - 1 ].toString() + "  "
                     + comment_st_comment[ k ].toString()                + "\n"
                     + out_buffer_lyrics_only[ k + 1 ].toString()        ;
  } else
  if ( song_medley_status >= SONG_1_TITLE_1 )  // SONG_1_TITLE_1 or SONG_2_TITLE_2
    for ( k = 0; k < song_medley_status; k++ )
      file_buffer +=   meta_tag_title[ k ].toString()                + "\n"
                     + meta_tag_subtitle_lyrics_only[ k ].toString() + "  "
                     + comment_st_comment[ k ].toString()            + "\n"
                     + out_buffer_lyrics_only[ k + 1 ].toString()              ;
  else // SONG_1_TITLE_0
  file_buffer +=   meta_tag_title[ 0 ].toString()                + "\n"
                 + meta_tag_subtitle_lyrics_only[ 0 ].toString() + "  "
                 + comment_st_comment[ 0 ].toString()            + "\n"
                 + out_buffer_lyrics_only[ 0 ].toString()              ;


  fs.writeFileSync( out_file_lyrics, file_buffer );

                                                 // chord-lyric html output
  file_buffer = html[ 0 ] + OUT_FILE_HTML_CSS
              + html[ 1 ] + meta_tag_title[ 0 ].toString() + "\n" ;

  if ( song_medley_status == SONG_2_TITLE_3 ) {
    file_buffer +=
      html[ 2 ] + "<i>" + meta_tag_title[ 0 ].toString() + "</i>" + "</h1>\n" ;

    if ( comment_st_comment[ 0 ].toString() != "" )
      file_buffer += "<h2>"+ comment_st_comment[ 0 ].toString()    + "</h2>\n" ;

    for ( k = 1; k < 3; k++ )
      file_buffer +=
            html[ 2 ] + meta_tag_title[ k ].toString()                  + "\n"
          + html[ 3 ] + meta_tag_subtitle[ k - 1].toString()            + "  "
                      + comment_st_comment[ k ].toString()
          + html[ 4 ] + out_buffer_html_chord_lyric[ k + 1 ].toString()       ;
  } else
  if ( song_medley_status >= SONG_1_TITLE_1 )  // SONG_1_TITLE_1 or SONG_2_TITLE_2
    for ( k = 0; k < song_medley_status; k++ )
      file_buffer +=
            html[ 2 ] + meta_tag_title[ k ].toString()              + "\n"
          + html[ 3 ] + meta_tag_subtitle[ k ].toString()           + "  "
                      + comment_st_comment[ k ].toString()
          + html[ 4 ] + out_buffer_html_chord_lyric[ k + 1 ].toString()       ;
  else // SONG_1_TITLE_0
    file_buffer +=
          html[ 2 ] + meta_tag_title[ 0 ].toString()              + "\n"
        + html[ 3 ] + meta_tag_subtitle[ 0 ].toString()           + "  "
                    + comment_st_comment[ 0 ].toString()
        + html[ 4 ] + out_buffer_html_chord_lyric[ 0 ].toString()       ;

  fs.writeFileSync( out_file_html, file_buffer + html[ 5 ].toString() );

                                                 // lyric-only html output
  file_buffer = html[ 0 ] + OUT_FILE_HTML_LYRICS_ONLY_CSS
              + html[ 1 ] + meta_tag_title[ 0 ].toString() + "\n" ;

  if ( song_medley_status == SONG_2_TITLE_3 ) {
    file_buffer +=
                html[ 2 ] + meta_tag_title[ 0 ].toString()         + "</h1>\n" ;

    if ( comment_st_comment[ 0 ].toString() != "" )
      file_buffer += "<h2>"+ comment_st_comment[ 0 ].toString()    + "</h2>\n" ;

    for ( k = 1; k < 3; k++ )
      file_buffer +=
            html[ 2 ] + meta_tag_title[ k ].toString()                    + "\n"
          + html[ 3 ] + meta_tag_subtitle_lyrics_only[ k - 1 ].toString() + "  "
                      + comment_st_comment[ k ].toString()                + "\n"
          + html[ 4 ] + out_buffer_html_lyrics_only[ k ].toString()       ;
  } else
  if ( song_medley_status >= SONG_1_TITLE_1 )  // SONG_1_TITLE_1 or SONG_2_TITLE_2
    for ( k = 0; k < song_medley_status; k++ )
      file_buffer +=
          html[ 2 ] + meta_tag_title[ k ].toString()                + "\n"
        + html[ 3 ] + meta_tag_subtitle_lyrics_only[ k ].toString() + "  "
                    + comment_st_comment[ k ].toString()            + "\n"
        + html[ 4 ] + out_buffer_html_lyrics_only[ k + 1 ].toString()         ;
  else // SONG_1_TITLE_0
  file_buffer +=
      html[ 2 ] + meta_tag_title[ 0 ].toString()                + "\n"
    + html[ 3 ] + meta_tag_subtitle_lyrics_only[ 0 ].toString() + "  "
                + comment_st_comment[ 0 ].toString()            + "\n"
    + html[ 4 ] + out_buffer_html_lyrics_only[ 0 ].toString()         ;

  fs.writeFileSync( out_file_html_lyrics_only, file_buffer + html[ 5 ].toString() );
} // function

////////////////////////////////////////////////////////////////////////////////
function prep_chord_list() {
// make final chord list by eliminating duplicates found in chord list
  var final_chord_list = [];
  var chord_list_length = chord_list.length;
  var a_chord    = "" ;
  var last_chord = "" ;
  var k = 0;

  chord_list.sort();

  for ( k = 0; k < chord_list_length; k++ ) {
    if ( k == 0 ) {
      last_chord = chord_list[ k ].toString();
      final_chord_list.push( last_chord );
    } else {
        a_chord = chord_list[ k ].toString();
        if ( last_chord < a_chord ) {
          last_chord = a_chord;
          final_chord_list.push( last_chord );
        } // if
    } // else
  } // for

  for ( k = 0; k < final_chord_list.length; k++ )
    final_chord_string += final_chord_list[ k ].toString() + " " ;

if ( DEBUGGING_MODE2 )  console.log( final_chord_string );

} // function

////////////////////////////////////////////////////////////////////////////////
function prep_subtitle_tags() {
  // all title, subtitle, and subtitle-related strings must not be undefined
  var k = 0;

  for ( k = meta_tag_subtitle.length; k < 3; k++ )
    meta_tag_subtitle.push( "" );

  for ( k = meta_tag_subtitle_lyrics_only.length; k < 3; k++ )
    meta_tag_subtitle_lyrics_only.push( "" );

  // normally only 2 subtitle comments -- one for each song.
  // if have 3, then first one is for medley title
  for ( k = comment_st_comment.length; k < 4; k++ )
    comment_st_comment.push( "" );

  for ( k = meta_tag_key.length;       k < 3; k++ )  meta_tag_key.push( "" );
  for ( k = meta_tag_time.length;      k < 3; k++ )  meta_tag_time.push( "" );
  for ( k = meta_tag_ccli.length;      k < 3; k++ )  meta_tag_ccli.push( "" );
  for ( k = meta_tag_author.length;    k < 3; k++ )  meta_tag_author.push( "" );
  for ( k = meta_tag_copyright.length; k < 3; k++ )  meta_tag_copyright.push( "" );
  for ( k = meta_tag_metronome.length; k < 3; k++ )  meta_tag_metronome.push( "" );
  for ( k = meta_tag_tag.length;       k < 3; k++ )  meta_tag_tag.push( "" );
}

////////////////////////////////////////////////////////////////////////////////
function create_subtitle( buf_indx ) {
// if subtitle is defined in input chordpro file, then do not alter,
// otherwise create ones using other meta-data info
  var first_copyright = "" ;
  var copyright_str   = meta_tag_copyright[ buf_indx ].toString();
  var semicolon_index = copyright_str.indexOf( ";" );  // index first semicolon

  if ( semicolon_index >= 0 )
    first_copyright = meta_tag_copyright[ buf_indx ].toString().slice( 0, semicolon_index );
  else
    first_copyright = meta_tag_copyright[ buf_indx ]; // only one copyright holder

  meta_tag_first_copyright[ buf_indx ] = first_copyright ;

  if ( meta_tag_key[ buf_indx ] != "" )  meta_tag_subtitle[ buf_indx ]
            += "Key: " + meta_tag_key[ buf_indx ] + "  " ;

  // difference between musician's subtitle and singers is only "Key"
  if ( meta_tag_time[ buf_indx ] != "" ) meta_tag_subtitle_lyrics_only[ buf_indx ]
            += "Time: " + meta_tag_time[ buf_indx ] + "  " ;

  if ( meta_tag_metronome[ buf_indx ] != "" ) meta_tag_subtitle_lyrics_only[ buf_indx ]
            += "Bpm: " + meta_tag_metronome[ buf_indx ] + "  " ;

  if ( meta_tag_ccli[ buf_indx ] != "" ) meta_tag_subtitle_lyrics_only[ buf_indx ]
            += "CCLI: " + meta_tag_ccli[ buf_indx ] + "  " ;

  if ( meta_tag_author[ buf_indx ] != "" ) meta_tag_subtitle_lyrics_only[ buf_indx ]
                     += meta_tag_author[ buf_indx ] ;

  meta_tag_subtitle_lyrics_only[ buf_indx ] += "  " + first_copyright ;
  meta_tag_subtitle[ buf_indx ] += meta_tag_subtitle_lyrics_only[ buf_indx ] ;

} // function
