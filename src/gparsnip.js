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
{guitar-comment:} {metronome:} {tempo:} {tag:} {soh} {eoh}
2016-09-09A: {tempo:}{footer:}{keywords:}{topic:}{book:}

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
  g. musical passage inline comment: e.g.
     {soh}Verse 3 #-- Key of C{soh}
     ..
     {soh}Verse 4 #-- Key of D{soh}

     In chord-lyrics, prints:
     Verse 3 -- Key of C
     ..
     Verse 4 -- Key of D

     In lyrics-only, prints:
     Verse 3
     ..
     Verse 4

4. Extensive test plan, regression testing scripts

NOTES:
v 2016-09-23 even_up_chord_lyric_lines(), forgot to declare spacey_string var
var fs = require('fs'); --> const fs ..
v 2016-09-14 bugfix for {tempo:}, a few comment additions

v 2016-09-09A
{tempo:} now accepted -- interchangeable w/ {metronome:}
{footer:} now accepted -- interchangeable w/ {copyright:}
{keywords:} {topic:} -- interchangeable, now accepted
{book:} -- now accepted
CSV format changed to reflect additions.  metronome wording --> tempo

v 2016-09-09
replaced user function trim_leading_trailing_spaces() w/ built-in trim() fcn

v 2016-09-05
chords were space-delimited, now using "|"

v 2016-09-04
fixed test_input_buffer() function:
problem -- if read warning character, then messeage repeated.
fixed -- on exit of for loop, then give warning message.
feature add -- test_input_buffer() gives filename of problem pro file.

v 45:
* modified test_input_buffer();
Before program continued on bad input.
Now program aborts on control characters (bad),
and continues on double-byte (ok), but gives warning when doing so.
* rewrite of title, subtitle routines to handle medleys better: 3 songs, 4 titles

v 44:
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
const fs                  = require( 'fs' ); // read from filesystem
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
var song_index = -1;

////////////////////////////////////////////////////////////////////////////////
// output -- .txt -- processed chord over lyrics plain text file
const DEFAULT_SONG_TITLE    = "Untitled Song" ;
var out_file_chord_lyrics   = process.argv[ 2 ] + ".txt" ; // chord+lyrics file
var out_buffer_chord_lyric  = [ "" , "" , "" , "" ]; // ALL out_line_chord and out_line_lyric into here
var out_line_chord          = "" ;          // 1 line -- output chord line
var out_line_lyric          = "" ;          // 1 line -- output lyric line

////////////////////////////////////////////////////////////////////////////////
// output -- .lst -- processed lyrics-only plain text file
var out_file_lyrics        = process.argv[ 2 ] + ".lst" ; // lyric-only file
var out_buffer_lyrics_only = [ "" , "" , "" , "" ]; // buffer -- lyrics only version of chordpro file
var out_line_lyrics_only   = "" ; // lyrics-only line
var skip_lyrics_only_line_processing = false;

////////////////////////////////////////////////////////////////////////////////
// output -- .htm -- processed chord over lyrics html w/ css
var html = [
  "<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"UTF-8\">\n<link rel=\"stylesheet\" type=\"text/css\" href=\"" ,
  "\">\n<style>\n</style>\n<title>" ,
  "</title>\n</head>\n<body>\n\n" , //\n<h1>" ,
  "</h1>\n<h2>" ,
  "</h2>\n" ,
  "\n</body>\n</html>\n" ,
  "<h1><i>" ,
  "</i></h1>\n"
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
var   process_lyric_exit_set_last_parse_mode = PARSE_UNDEFINED;

var j = 0;  // length of current musical chord being processed, no brackets

////////////////////////////////////////////////////////////////////////////////
// meta-tag data arrays and vars
const MAX_TITLES_SUBTITLES        = 4; // medley title plus 3 songs
var meta_tag_title                = []; //[ "", "", "", "" ] ;
var meta_tag_subtitle             = [ "", "", "", "" ] ; // {subtitle:}
// lyrics-only version of subtitle omits some info from standard subtitle
var meta_tag_subtitle_lyrics_only = [ "", "", "", "" ] ;
var meta_tag_key                  = [ "", "", "", "" ] ; // {key:}
var meta_tag_time                 = [ "", "", "", "" ] ; // {time:}
var meta_tag_tempo                = [ "", "", "", "" ] ; // {metronome:}, {tempo:}, i.e. bpm
var meta_tag_ccli                 = [ "", "", "", "" ] ; // {ccli:}
var meta_tag_author               = [ "", "", "", "" ] ; // {author:}
var meta_tag_copyright            = [ "", "", "", "" ] ; // {copyright:}
var meta_tag_first_copyright      = [ "", "", "", "" ] ; // created from copyright
// new meta_tags for CSV/database compilation
var meta_tag_tag                  = [ "", "", "", "" ] ; // {tag:}
var meta_tag_topic                = [ "", "", "", "" ] ; // {keyword:}
var meta_tag_book                 = [ "", "", "", "" ] ; // {book:}
var hashtag_st_comment            = [ "", "", "", "" ] ; // #st-comment:

                                    // meta-tag processing
var meta_tag_term             = "" ;
var meta_tag_argument         = "" ; // everything after ":"
var meta_tag_argument_trimmed = "" ; // as above, no leading, trailing spaces
var meta_tag_argument_length  = -1;
                                   // variables for handling soh and eoh
var meta_tag_soh_count        =  0;
var meta_tag_eoh_count        =  0;
var in_line_last_soh_index    = -1; // last position of last found {soh}
var in_line_last_eoh_index    = -1; // last position of last found {soh}

////////////////////////////////////////////////////////////////////////////////
// CSV-database vars
const CSV_FORMAT_FILE        = "0gparsnip.csv" ;  // chord+lyrics css file
const CSV_FORMAT = "title\tkey\ttime\ttempo\tccli\tauthor\tcopyright\ttag\ttopic\tbook\tfilename\n" ;

var out_file_csv = process.argv[ 2 ] + ".csv" ;

////////////////////////////////////////////////////////////////////////////////
const CHORD_DELIMITER   = "|"
var chord_list          = [] ; // keep track of all chords used in song
var final_chord_string  = CHORD_DELIMITER ; // list of chords used, "|" delimited
var out_file_chord_list = process.argv[ 2 ] + ".cd1" ;

//var DEBUGGING_MODE1 = true; // few comments
var DEBUGGING_MODE1 = false;
//var DEBUGGING_MODE2 = true; // heavy commments
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

        in_line_length             = in_line.length;

        out_line_chord             = "" ;
        out_line_lyric             = "" ;
        out_line_lyrics_only       = "" ;

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

    output_results();
  } // if test_input_buffer

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
                                     last_parse_mode_flag = process_lyric_exit_set_last_parse_mode;
                                     last_parse_string_length = parse_string.length;
                                     parse_mode      = PARSE_META_TAG;
                                     parse_string    = "";               i++;
        } else
        if ( in_line[ i ] == "[" ) { process_lyric();
                                     last_parse_mode = PARSE_LYRIC;
                                     last_parse_mode_flag = process_lyric_exit_set_last_parse_mode;
                                     last_parse_string_length = parse_string.length;
                                     parse_mode      = PARSE_CHORD;
                                     parse_string    = "";               i++;
        } else {
                                     parse_string += in_line[ i ];
// can't do last_parse_mode = PARSE_LYRIC_SPACE or PARSE_LYRIC_NON_SPACE
// here -- premature, because neet do read current/correct value of
// last_parse_mode inside process_lyric() first
                                     if ( in_line[ i ] == " " )
                                        process_lyric_exit_set_last_parse_mode
                                          = PARSE_LYRIC_SPACE;
                                     else
                                        process_lyric_exit_set_last_parse_mode
                                          = PARSE_LYRIC_NON_SPACE;
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
function check_song_index() {
  if ( song_index < 0 ) {
    song_index = 0;
    meta_tag_title.push( DEFAULT_SONG_TITLE );
  }
} // function

////////////////////////////////////////////////////////////////////////////////
function process_blank_line() {
// nothing in current line -- in_line string empty
  check_song_index();

  out_buffer_chord_lyric[ song_index ]      += "\n" ;
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

  if ( ( colon_pos == 11 ) && ( comment_term == "st-comment") ) {
    check_song_index();
    hashtag_st_comment[ song_index ] = comment_argument;
  }
} // function

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

  switch ( meta_tag_term ) { // in case user adds meta-tags before title
    case "subtitle:"  :
    case "st:"        :
    case "su:"        :
    case "key:"       :
    case "k:"         :
    case "time:"      :
    case "tempo:"     :
    case "metronome:" :
    case "ccli:"      :
    case "author:"    :
    case "copyright:" :
    case "footer"     :
    case "tag:"       :
    case "topic:"     :
    case "keyword:"   :
    case "book:"      : check_song_index();
/*                         break;
    case "comment:"        :
    case "c:"              :
    case "comment_bold:"   :
    case "cb:"             :
    case "comment_italic:" :
    case "ci:"             :
    case "guitar_comment:" :
    case "gc:"             :
    case "soh"             :
    case "eoh"             :
    case "title:"          :
    case "t:"              : */
    default: {} // unrecognized meta-tag, no processing, no mod parse flags */
  } // switch

  switch ( meta_tag_term ) {
    case "title:"    :
    case "t:"        :  if ( meta_tag_title.length < MAX_TITLES_SUBTITLES ) {
                          song_index++ ; // select next buffer for chord/lyrics
                          meta_tag_title.push( meta_tag_argument_trimmed );
                        }
                        break;
    case "subtitle:"  :
    case "st:"        :
    case "su:"        :  meta_tag_subtitle[ song_index ]  = meta_tag_argument_trimmed;  break;
    case "key:"       :
    case "k:"         :  meta_tag_key[ song_index ]       = meta_tag_argument_trimmed;  break;
    case "time:"      :  meta_tag_time[ song_index ]      = meta_tag_argument_trimmed;  break;
    case "tempo:"     :
    case "metronome:" :  meta_tag_tempo[ song_index ]     = meta_tag_argument_trimmed;  break;
    case "ccli:"      :  meta_tag_ccli[ song_index ]      = meta_tag_argument_trimmed;  break;
    case "author:"    :  meta_tag_author[ song_index ]    = meta_tag_argument_trimmed;  break;
    case "footer"     :
    case "copyright:" :  meta_tag_copyright[ song_index ] = meta_tag_argument_trimmed;  break;
    case "tag:"       :  meta_tag_tag[ song_index ]       = meta_tag_argument_trimmed;  break;
    case "topic:"     :
    case "keyword:"   :  meta_tag_topic[ song_index ]     = meta_tag_argument_trimmed;  break;
    case "book:"      :  meta_tag_book[ song_index ]      = meta_tag_argument_trimmed;  break;

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

    default: {} // unrecognized meta-tag, no processing, no mod parse flags
  } // switch

if ( DEBUGGING_MODE1 ) { console.log( "/*----------------- process_meta_tag()" );
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
      spacey_string = space_string( parse_string.length );

      out_line_chord            += spacey_string;
      out_line_lyric            += parse_string;

      out_line_html_chord       += spacey_string;
      out_line_html_lyric       += parse_string;

      out_line_lyrics_only      += parse_string;
      out_line_html_lyrics_only += parse_string;
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
/*         if ( last_parse_mode_flag == PARSE_LYRIC_NON_SPACE )
             spacey_string = space_string( chord_lyric_line_gap );
           else  // last_parse_mode == PARSE_LYRIC_SPACE
             spacey_string = "*" + space_string( chord_lyric_line_gap -1 ); */
         out_line_lyric            += spacey_string + parse_string;
         out_line_html_lyric       += spacey_string + parse_string;
         out_line_html_lyrics_only +=                 parse_string;
         out_line_lyrics_only      +=                 parse_string;
      }
      break;

    case PARSE_LYRIC        :
    default                 :  out_line_lyric            += parse_string;
                               out_line_lyrics_only      += parse_string;
                               out_line_html_lyrics_only += parse_string;
                               out_line_html_lyric       += parse_string;
  } // switch

if ( DEBUGGING_MODE1 ) { console.log( "/*----------------- process_lyric()" );
                         console.log( out_line_chord, "##" );
                         console.log( out_line_lyric, "##" );
                       //console.log( out_line_html_lyrics_only, "##" );
                         console.log( "*/----------------- process_lyric()" ); }
} // function

////////////////////////////////////////////////////////////////////////////////
function even_up_chord_lyric_lines() {
  var chord_lyric_length_delta = out_line_chord.length - out_line_lyric.length;
  var spacey_string = "";

  if ( chord_lyric_length_delta > 0 ) {
    spacey_string        = space_string( chord_lyric_length_delta );
    out_line_lyric      += spacey_string;
    out_line_html_lyric += spacey_string;
  } else
  if ( chord_lyric_length_delta < 0 ) {
    spacey_string        = space_string( Math.abs( chord_lyric_length_delta ) );
    out_line_chord      += spacey_string;
    out_line_html_chord += spacey_string;
  }
} // function

////////////////////////////////////////////////////////////////////////////////
function process_meta_tag_guitar_comment() { // meta-tag -- guitar comment
  var spacey_string = space_string( meta_tag_argument.length );

  even_up_chord_lyric_lines();

  out_line_chord      +=               meta_tag_argument;
  out_line_lyric      +=               spacey_string;

  out_line_html_chord += "</h6><h5>" + meta_tag_argument + "</h5><h6>" ;
  out_line_html_lyric +=               spacey_string;

  last_parse_mode          = PARSE_META_TAG;
  last_parse_mode_flag     = PARSE_META_TAG_GUITAR_COMMENT;
  last_parse_string_length = parse_string.length;
// since gc is a chord-only meta-tag, lyrics-only text/html is not added to
} // function

////////////////////////////////////////////////////////////////////////////////
function process_meta_tag_comment() { // meta-tag -- inline comment
  var spacey_string = space_string( meta_tag_argument.length );

if ( DEBUGGING_MODE2 )  console.log( "process_meta_tag_comment()" );

  even_up_chord_lyric_lines();

  out_line_chord      +=              spacey_string;
  out_line_lyric      +=              meta_tag_argument;

  out_line_html_chord +=              spacey_string;
  out_line_html_lyric += "</p><h4>" + meta_tag_argument + "</h4><p>" ;

  last_parse_mode          = PARSE_META_TAG;
  last_parse_mode_flag     = PARSE_META_TAG_COMMENT;
  last_parse_string_length = parse_string.length;
// since meta_tag_comment is a lyric-line musician only comment,
// lyrics-only text/html is not added to
}

////////////////////////////////////////////////////////////////////////////////
function process_meta_tag_soh() { // handle {soh} tag
  out_line_html_lyric       += "</p><h4>" ;
  out_line_html_lyrics_only += "</p><h4>" ;

  meta_tag_soh_count++ ;

  if ( in_line_last_soh_index == -1 )
    in_line_last_soh_index = i - 4;
};

////////////////////////////////////////////////////////////////////////////////
function process_meta_tag_eoh() { // handle {eoh} tag
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
returns true or false (input file is found) */
  var in_file_string    = process.argv[ 2 ] ;
  var in_file_name_full = "" ;
  var dot_pos           = in_file_string.indexOf( "." );

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
  var charcode      = 0;   // decimal character code of input character
  var warning_level = 1; // -1 -- bad, abort; 0 -- warning; 1 -- fantastic, no problems

  for ( in_file_buffer_index = 0; in_file_buffer_index < in_file_buffer_length;
        in_file_buffer_index++ ) {
    charcode = in_file_buffer.charCodeAt( in_file_buffer_index );

    if ( charcode < 10 )
      warning_level    = -1;   // control codes
    else if ( charcode == 10 )
      {} // okay, LF
    else if ( charcode < 32 )
      warning_level    = -1;   // control codes
    else if ( charcode < 127 )
      {} // okay, space .. tilde
    else if ( charcode < 49824 )
      warning_level    = -1; // control codes
    else warning_level = 0; // possibly okay, but multi-byte char

    if ( warning_level == -1 ) {
      console.log ( "File: ", in_file_pro );
      console.log( "Aborting -- control characters found." );
      console.log( "Correct Format of chordpro FILE.pro: plain text, utf8, Linux LF style; char in [\" \" .. \"~\" ]" );
      console.log( "Character is probably a flat (b), sharp(#), or smart left/right single or double quote character." );
      console.log( "Character decimal code is:", charcode );
      return false;
    }
  } // for

  if ( warning_level == 0 ) {
    console.log ( "File: ", in_file_pro );
    console.log( "Warning -- input file has possible characters which may cause problems:", in_file_pro );
    console.log( "Correct Format of chordpro FILE.pro: plain text, utf8, Linux LF style; char in [\" \" .. \"~\" ]" );
    console.log( "Character is probably a flat (b), sharp(#), or smart left/right single or double quote character." );
    console.log( "Character found has decimal code #:", charcode );
    console.log( "Continuing processing");
  } // if

  return true;
}

////////////////////////////////////////////////////////////////////////////////
function trim_leading_spaces( txt_line ) { // trim leading spaces
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
function trim_trailing_spaces( txt_line ) { // trim trailing spaces
  var k;
  var out_txt_line = txt_line;

  for ( k = out_txt_line.length - 1; k >= 0; k-- )
    if ( out_txt_line[ k ] == " " )
      out_txt_line = out_txt_line.slice( 0, k );
    else break;

  return out_txt_line;
}

////////////////////////////////////////////////////////////////////////////////
function remove_double_spaces( txt_line ) {
  // remove any instance of two spaces next to each other -- replace w/ 1 space
  return txt_line.replace( /\s\s/g, " " );;
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
  var hash_pos = 0; // .. out_line_lyric.indexOf( "#" )

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
/*    out_buffer_chord_lyric[ song_index ] += out_line_lyric              + "\n" ;
      out_buffer_lyrics_only[ song_index ] += out_line_lyrics_only.trim() + "\n" ; */
      // check to see if this is a musical heading section
      if (    ( meta_tag_soh_count == 1 ) && ( meta_tag_eoh_count == 1 )
           && (   in_line_last_soh_index == 0 )
           && ( ( in_line_last_eoh_index + 1 ) == in_line_length ) ) { // yes

         hash_pos = out_line_lyric.indexOf( "#" );

         if ( hash_pos == -1 ) { // no case of e.g.: Verse 3 #-- To Key of D
           out_buffer_html_chord_lyric[ song_index ] +=
                                           "<h3>" + out_line_lyric + "</h3>\n" ;
           out_buffer_html_lyrics_only[ song_index ] +=
                                           "<h3>" + out_line_lyric + "</h3>\n" ;
           out_buffer_chord_lyric[ song_index ] += out_line_lyric              + "\n" ;
           out_buffer_lyrics_only[ song_index ] += out_line_lyrics_only.trim() + "\n" ;
           }
         else { // yes case of e.g.: Verse 3 #-- To Key of D
           out_buffer_html_chord_lyric[ song_index ] += "<h3>"
             + out_line_lyric.substring( 0, hash_pos ) // e.g. Verse 3 -- To Key of D
             + out_line_lyric.substring( hash_pos + 1 ) // omit #
                                                      + "</h3>\n" ;
           out_buffer_html_lyrics_only[ song_index ] +=          "<h3>" // e.g. Verse 3
             +  out_line_lyric.substring( 0, hash_pos ).trim() + "</h3>\n" ;

           out_buffer_chord_lyric[ song_index ] += // e.g.: Verse 3 -- To Key of D
               out_line_lyric.substring( 0, hash_pos )
             + out_line_lyric.substring( hash_pos + 1 ) + "\n" ;

           hash_pos = out_line_lyrics_only.indexOf( "#" );
           out_buffer_lyrics_only[ song_index ] += // e.g.: Verse 3
             out_line_lyrics_only.substring( 0, hash_pos ).trim() + "\n" ;
         }
      } else { // no - regular highlighted section
        out_buffer_html_chord_lyric[ song_index ] +=
                                      out_line_html_lyric       + "</p><br>\n" ;
        out_buffer_html_lyrics_only[ song_index ] +=
                                      out_line_html_lyrics_only + "</p><br>\n" ;

        out_buffer_chord_lyric[ song_index ] += out_line_lyric              + "\n" ;
        out_buffer_lyrics_only[ song_index ] += out_line_lyrics_only.trim() + "\n" ;
      }
    } // if meta_tag_eoh_count ..
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
      out_buffer_lyrics_only[ song_index ] += out_line_lyrics_only.trim() + "\n" ;
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
                               // NOT ALLOWED -- medley w/ 3 songs, 3 titles
  const SONG_3_TITLE_4   =  4; // 3 songs, 4 titles -- 1st one is medley title

  var song_medley_status = meta_tag_title.length;
  var k           = 0;
  var k_start     = 0;
  var file_buffer = ""; // do all file writes one time only

  prep_chord_list();                             // chord list output
  fs.writeFileSync( out_file_chord_list, final_chord_string );

  for ( k = 0; k < song_medley_status; k++ )  // make subtitles (w/o st-comment)
    create_subtitle( k );

// ----------------------------------------------handle CSV file output
  file_buffer = "" ;

  if ( song_medley_status > SONG_2_TITLE_2 ) { // medley title
    file_buffer =     meta_tag_title[ 0 ].toString()        + "\t"
                    + meta_tag_key[ 0 ].toString()          + "\t"
                    + meta_tag_time[ 0 ].toString()         + "\t"
                    + meta_tag_tempo[ 0 ].toString()        + "\t"
                  /*+ meta_tag_ccli[ k ].toString()*/       + "\t"
                  /*+ meta_tag_author[ k ].toString()*/     + "\t"
                  /*+ meta_tag_copyright[ k ].toString()*/  + "\t"
                    + meta_tag_tag[ 0 ].toString()          + "\t"
                    + meta_tag_topic[ 0 ].toString()        + "\t"
                    + meta_tag_book[ 0 ].toString()         + "\t"
                    + in_file_noext                         + "\n" ;
    k_start = 1;
  }
  else k_start = 0;

  for ( k = k_start; k < song_medley_status; k++ )
    file_buffer += meta_tag_title[ k ].toString()           + "\t"
                +  meta_tag_key[ k ].toString()             + "\t"
                +  meta_tag_time[ k ].toString()            + "\t"
                +  meta_tag_ccli[ k ].toString()            + "\t"
                +  meta_tag_tempo[ k ].toString()           + "\t"
                +  meta_tag_author[ k ].toString()          + "\t"
                +  meta_tag_first_copyright[ k ].toString() + "\t"
                +  meta_tag_tag[ k ].toString()             + "\t"
                +  meta_tag_topic[ k ].toString()           + "\t"
                +  meta_tag_book[ k ].toString()            + "\t"
                +  in_file_noext                            + "\n" ;

  fs.writeFileSync( out_file_csv, file_buffer );
  fs.writeFileSync( CSV_FORMAT_FILE, CSV_FORMAT );

// ----------------------------------------------chord-lyric text output
  file_buffer = "" ;

  if ( song_medley_status > SONG_2_TITLE_2 ) { // medley title
    file_buffer = meta_tag_title[ 0 ].toString()               + "\n" ;

    if ( meta_tag_subtitle[ 0 ].toString() == "" ) // medley subtitle
      if ( hashtag_st_comment[ 0 ].toString() == "" )
        {}
      else
        file_buffer += hashtag_st_comment[ 0 ].toString()      + "\n" ;
    else
      if ( hashtag_st_comment[ 0 ].toString() == "" )
        file_buffer += meta_tag_subtitle[ 0 ].toString()       + "\n" ;
      else
        file_buffer += meta_tag_subtitle[ 0 ].toString()       + "  "
                    +  hashtag_st_comment[ 0 ].toString() ;    + "\n" ;
    k_start = 1;
  }
  else
    k_start = 0;

  for ( k = k_start; k < song_medley_status; k++ )
    file_buffer += meta_tag_title[ k ].toString()              + "\n"
                +  meta_tag_subtitle[ k ].toString()           + "  "
                +  hashtag_st_comment[ k ].toString()          + "\n"
                +  out_buffer_chord_lyric[ k ].toString()             ;

  fs.writeFileSync( out_file_chord_lyrics, file_buffer );

// ----------------------------------------------lyric-only text output
  file_buffer = "" ;

  if ( song_medley_status > SONG_2_TITLE_2 ) {             // medley title
    file_buffer = meta_tag_title[ 0 ].toString()                        + "\n" ;

    if   ( meta_tag_subtitle_lyrics_only[ 0 ].toString() == "" ) // medley subtitle
      if ( hashtag_st_comment[ 0 ].toString() == "" )
        {}
      else
        file_buffer += hashtag_st_comment[ k ].toString()               + "\n" ;
    else
      if ( hashtag_st_comment[ 0 ].toString() == "" )
        file_buffer += meta_tag_subtitle_lyrics_only[ 0 ].toString()    + "\n" ;
      else
        file_buffer += meta_tag_subtitle_lyrics_only[ 0 ].toString()    + "  "
                    +  hashtag_st_comment[ 0 ].toString() ;             + "\n" ;
    k_start = 1;
  }
  else
    k_start = 0;

  for ( k = k_start; k < song_medley_status; k++ )
    file_buffer += meta_tag_title[ k ].toString()                       + "\n"
                +  meta_tag_subtitle_lyrics_only[ k ].toString()        + "  "
                +  hashtag_st_comment[ k ].toString()                   + "\n"
                +  out_buffer_lyrics_only[ k ].toString()               ;

  fs.writeFileSync( out_file_lyrics, file_buffer );

// ----------------------------------------------chord-lyric html output
  file_buffer = html[ 0 ] + OUT_FILE_HTML_CSS
              + html[ 1 ] + meta_tag_title[ 0 ].toString() + html[ 2 ];

  meta_tag_subtitle[ 0 ] = meta_tag_subtitle[ 0 ].toString().trim();

  if ( song_medley_status > SONG_2_TITLE_2 ) {             // medley title
    file_buffer += html[ 6 ] + meta_tag_title[ 0 ].toString() + html[ 7 ];

    if   ( meta_tag_subtitle[ 0 ].toString() == "" )         // medley subtitle
      if ( hashtag_st_comment[ 0 ].toString() == "" )
        {}
      else
        file_buffer += "<h2>" + hashtag_st_comment[ 0 ].toString() + "</h2>\n\n" ;
    else
      if ( hashtag_st_comment[ 0 ].toString() == "" )
        file_buffer += "<h2>" + meta_tag_subtitle[ 0 ].toString() + "</h2>\n\n" ;
      else
        file_buffer += html[ 3 ] + meta_tag_subtitle[ 0 ].toString()
                    +  "  "      + hashtag_st_comment[ 0 ].toString()
                    + "</h2>\n\n" ;
    k_start = 1;
  }
  else
    k_start = 0;

  for ( k = k_start; k < song_medley_status; k++ )
    file_buffer += "<h1>"    + meta_tag_title[ k ].toString()
                +  html[ 3 ] + meta_tag_subtitle[ k ].toString()
                +  "  "      + hashtag_st_comment[ k ].toString()
                +  html[ 4 ] + out_buffer_html_chord_lyric[ k ].toString() ;

  fs.writeFileSync( out_file_html, file_buffer + html[ 5 ].toString() );

// ----------------------------------------------lyric-only html output
  file_buffer = html[ 0 ] + OUT_FILE_HTML_LYRICS_ONLY_CSS
              + html[ 1 ] + meta_tag_title[ 0 ].toString() + html[ 2 ];

  meta_tag_subtitle_lyrics_only[ 0 ] =
  meta_tag_subtitle_lyrics_only[ 0 ].toString().trim();

  if ( song_medley_status > SONG_2_TITLE_2 ) { // medley title
    file_buffer +=
      html[ 6 ] + meta_tag_title[ 0 ].toString() + html[ 7 ];

    if   ( meta_tag_subtitle_lyrics_only[ 0 ].toString() == "" ) // medley subt
      if ( hashtag_st_comment[ 0 ].toString() == "" )
        {}
      else
        file_buffer += "<h2>" + hashtag_st_comment[ 0 ].toString()
                    +  "</h2>\n\n" ;
    else
      if ( hashtag_st_comment[ 0 ].toString() == "" )
        file_buffer += "<h2>" +  meta_tag_subtitle_lyrics_only[ 0 ].toString()
                    + "</h2>\n\n" ;
      else
        file_buffer += "<h2>" + meta_tag_subtitle_lyrics_only[ 0 ].toString()
                    +  "  "   + hashtag_st_comment[ 0 ].toString()
                    + "</h2>\n\n" ;
    k_start = 1;
  }
  else
    k_start = 0;

  for ( k = k_start; k < song_medley_status; k++ )
    file_buffer += "<h1>"    + meta_tag_title[ k ].toString()
                +  html[ 3 ] + meta_tag_subtitle_lyrics_only[ k ].toString()
                +  "  "      + hashtag_st_comment[ k ].toString()
                +  html[ 4 ] + out_buffer_html_lyrics_only[ k ].toString() ;

  fs.writeFileSync( out_file_html_lyrics_only, file_buffer + html[ 5 ].toString() );
} // function

////////////////////////////////////////////////////////////////////////////////
function prep_chord_list() {
// make final chord list by eliminating duplicates found in chord list
  var final_chord_list  = [];
  var chord_list_length = chord_list.length;
  var a_chord           = "" ;
  var last_chord        = "" ;
  var k                 = 0;

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
    final_chord_string += final_chord_list[ k ].toString() + CHORD_DELIMITER ;

if ( DEBUGGING_MODE2 )  console.log( final_chord_string );
} // function

////////////////////////////////////////////////////////////////////////////////
function create_subtitle( buf_indx ) {
// if subtitle is defined in input chordpro file, then do not alter,
// otherwise auto-generate one using other meta-data info
  var first_copyright = "" ;
  var copyright_str   = meta_tag_copyright[ buf_indx ].toString();
  var semicolon_index = copyright_str.indexOf( ";" );  // index first semicolon

  if ( meta_tag_subtitle[ buf_indx ] == "" ) {
    if ( semicolon_index >= 0 )
      first_copyright =
        meta_tag_copyright[ buf_indx ].toString().slice( 0, semicolon_index );
    else   // only one copyright holder
      first_copyright = meta_tag_copyright[ buf_indx ];

    meta_tag_first_copyright[ buf_indx ] = first_copyright ;

    if ( meta_tag_key[ buf_indx ] != "" ) meta_tag_subtitle[ buf_indx ]
      += "Key: " + meta_tag_key[ buf_indx ] + "  " ;

    // difference between musician's subtitle and singers is only "Key"
    if ( meta_tag_time[ buf_indx ] != "" ) meta_tag_subtitle_lyrics_only[ buf_indx ]
      += "Time: " + meta_tag_time[ buf_indx ] + "  " ;

    if ( meta_tag_tempo[ buf_indx ] != "" ) meta_tag_subtitle_lyrics_only[ buf_indx ]
      += "Bpm: " + meta_tag_tempo[ buf_indx ] + "  " ;

    if ( meta_tag_ccli[ buf_indx ] != "" ) meta_tag_subtitle_lyrics_only[ buf_indx ]
      += "CCLI: " + meta_tag_ccli[ buf_indx ] + "  " ;

    if ( meta_tag_author[ buf_indx ] != "" ) meta_tag_subtitle_lyrics_only[ buf_indx ]
      += meta_tag_author[ buf_indx ] ;

    meta_tag_subtitle_lyrics_only[ buf_indx ] += "  " + first_copyright ;

    meta_tag_subtitle[ buf_indx ] += meta_tag_subtitle_lyrics_only[ buf_indx ] ;
  }
  else // user used {susbitle:} -- meta_tag_subtitle[ ] already set
     meta_tag_subtitle_lyrics_only[ buf_indx ] = meta_tag_subtitle[ buf_indx ];

} // function
