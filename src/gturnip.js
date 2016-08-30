/*******************************************************************************
GTurnip -- ChordPro Song Transposer / Chord Substitution

SUMMARY: Program takes a ChordPro -encoded plain text file
  and does chord transposing/ substitution.

PHILOSOPHY: Do it (W)RIGHT, Do it Once

CURRENT VERSION:
ls
song.pro
song.pro
  #chord: [C] [Dm] [Em] [F] [G] [Am]
  #chord-new: [D] [Em] [F#m] [G] [A] [Bm]
nodejs gturnip song.pro
ls
song.pro
song-new.pro



NEW VERSION:

TO RUN:
# ls
song.pro  song.cd1  song.cd2
# nodejs gturnip song

INPUT:
song.pro  ( Unix/Linux LF style, UTF-8 encoded)
song.cd1  ( chords used in song.pro, space-delimited )
song.cd2  ( substitution chords, space-delimited )

OUTPUT:
song-NEW.pro ( new song.pro with chord substitutions )

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
  v1.3 feature add
  nodejs gturnip FILE --report
    This generates a chord report

  nodejs gturnip FILE --substitution

  nodejs gturnip FILE --transpose -2

  v1.2
  fixed small bug in get_chord_comment_lines_agument() where
  if #chords-new: was before #chords: program would fail -- undeclared var

  v1.1
  Works.
  Improved search and replace chord algorithm.
  Cleaned up code.
  Fixed bugs in fix_filenames() routine

  Future improvements:
  Handle meta-tag {key:}
  Use regular expression in seach and replace chord algorithm

  Algorithm:

  1. read in entire .pro file
  2. find, parse #chord: and #chord-new lines
  3. remove #chord and #chord-new lines from input buffer.
  4. use find and replace string methods to replace chords.
     A. find original chord
     B. replace original chord with intermediate chord
     C. replace intermediate chord with final chord
  5. add in #chord-new line using #chord instead
  6. Write out results.

  str.search( )
  str.replace( )

*/
var Key_A =  [ "A",  "B",  "C#", "D",  "E",  "F#", "G#" ];
var Key_Bb = [ "Bb", "C",  "D",  "Eb", "F",  "G",  "A"  ];
var Key_B =  [ "B",  "C#", "D#", "E",  "F#", "G#", "A"  ];
var Key_C =  [ "C",  "D",  "E",  "F",  "G",  "A",  "B"  ];
var Key_Db = [ "Db", "Eb", "F",  "Gb", "Ab", "Bb", "C"  ];
var Key_D =  [ "D",  "E",  "F#", "G",  "A",  "B",  "C#" ];
var Key_Eb = [ "Eb", "F",  "G",  "Ab", "Bb", "C",  "D"  ];
var Key_E =  [ "E",  "F#", "G#", "A",  "B",  "C#", "D#" ];
var Key_F =  [ "F",  "G",  "A",  "Bb", "C",  "D",  "E"  ];
var Key_Fs = [ "F#", "G#", "A#", "B",  "C#", "D#", "E#" ];
var Key_G =  [ "G",  "A",  "B",  "C",  "D",  "E",  "F#" ];
var Key_Ab = [ "Ab", "Bb", "C",  "Db", "Eb", "F",  "G"  ];

var Keys = [ "A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab" ];

var fs                    = require( 'fs' ); // read from filesystem
var in_file_noext         = process.argv[ 2 ] ;
var in_file_pro           = process.argv[ 2 ] + ".pro" ; //chordpro source file
var out_file_pro          = process.argv[ 2 ] + "-NEW.pro" ; // new file

var comment_chord_lines_argument_old = "" ; // #chords: <this string>
var comment_chord_lines_argument_new = "" ; // #chords-new: <this string>

var chords     = [];   // user-defined old chords
var chords_XXX = [];   // user-defined intermediate chords for transposing
var chords_new = [];   // user-defined new chords

/* song_buffer:
   0 -- original .pro file from disk
   1 -- remove lines: #chords:, #chords-new
   2 -- pro file w/ intermediate substitution chords
   3 -- pro file w/ new chords, output-ready, except for #chords: lines
*/
var song_buffer = [ "" , "" , "" , "" ];

//var DEBUGGING_MODE = true;
var DEBUGGING_MODE = false;

////////////////////////////////////////////////////////////////////////////////
function process_comment_line() {
// if line starts with #, then the entire line is a comment.
// if line starts with #chord: or #chord-new, then grab string
  const COMMENT_CHORDS_COLON_POS     = 7 ; // #chords:
  const COMMENT_CHORDS_NEW_COLON_POS = 11; // #chords-new:
  var colon_pos        = in_line.indexOf( ":" );
  var comment_term     = in_line.substring( 1, colon_pos );
  var comment_argument = in_line.substring( colon_pos );

  if ( ( colon_pos == COMMENT_CHORDS_COLON_POS ) && ( comment_term == "chords") )
    process_comment_chords();
  else
  if ( ( colon_pos == COMMENT_CHORDS_NEW_COLON_POS ) && ( comment_term == "chords-new") )
    process_comment_new_chords();
} // function

////////////////////////////////////////////////////////////////////////////////
function fix_filenames()
{
/* input filename must be FILE.pro.  However, when calling gparsnip Program
normally call:     nodejs gturnip FILE
now can also call: nodejs gturnip FILE.pro
returns true or false (input file is found)
*/
  var in_file_string    = process.argv[ 2 ] ;
  var in_file_name_full = in_file_string + ".pro" ;
  var dot_pos           = in_file_string.indexOf( "." );

  if ( ( in_file_string == "--help" ) || ( in_file_string == "" ) ) {
    console.log( "Usage: gturnip FILE" );
    console.log( "Input:  FILE.pro is a plain text file, ChordPro info, utf8 encoded, Linux (LF) style." )
    console.log( "Output:" );
    console.log( "FILE-new.txt  (chord+lyrics, chord changes)" );
    return false;
  }

  if ( dot_pos >= 0 )
    if ( fs.existsSync( in_file_string ) ) { // then user used FILE.pro and file exists
      in_file_pro               = in_file_string;    // have to initialize vars
      in_file_noext             = in_file_string.substring( 0, dot_pos );
      out_file_pro              = in_file_noext + "-NEW.pro" ;
      return true;
    } else { // user used FILE.pro, but can't find file
      console.log( "Can't find input file:", in_file_string );
      return false;
    }
  else  // user used FILE, have to test
    if ( fs.existsSync( in_file_name_full ) )// file exists, all good
       return true;
    else {
      console.log( "Can't find input file:", in_file_name_full );
      return false;
    } // if ( fs.existsSync( in_file_name_full ) )
} // function

////////////////////////////////////////////////////////////////////////////////
/* function extract_chords( chordy_str ) { can't make this work because of return array
  var parse_now = true;
  var left_bracket_index  = 0;
  var right_bracket_index = 0;
  var chordy_found = [] ; // chords found, w/o brackets

  while ( parse_now ) {
    left_bracket_index  = chordy_str.indexOf( "[" );
    right_bracket_index = chordy_str.indexOf( "]" );

    if ( ( left_bracket_index >= 0 ) && ( right_bracket_index >= 0 )
        && ( ( right_bracket_index - left_bracket_index ) > 0 ) )  {
       chordy_found.push( chordy_str.substring( left_bracket_index + 1, right_bracket_index ) );
       chordy_str = chordy_str.substring( right_bracket_index + 1 );
    } else
      parse_now = false;
  } // while
//  return chordy_found;
} // function
*/

////////////////////////////////////////////////////////////////////////////////
function extract_chords_old( chordy_str ) {
  var parse_now           = true;
  var left_bracket_index  = 0;
  var right_bracket_index = 0;

  while ( parse_now ) {
    left_bracket_index  = chordy_str.indexOf( "[" );
    right_bracket_index = chordy_str.indexOf( "]" );

    if ( ( left_bracket_index >= 0 ) && ( right_bracket_index >= 0 )
        && ( ( right_bracket_index - left_bracket_index ) > 0 ) ) {
      chords.push( chordy_str.substring( left_bracket_index + 1, right_bracket_index ) );
      chordy_str = chordy_str.substring( right_bracket_index + 1 );
    } else
      parse_now = false;
  } // while
} // function

////////////////////////////////////////////////////////////////////////////////
function extract_chords_new( chordy_str ) {
  var parse_now           = true;
  var left_bracket_index  = 0;
  var right_bracket_index = 0;

  while ( parse_now ) {
    left_bracket_index  = chordy_str.indexOf( "[" );
    right_bracket_index = chordy_str.indexOf( "]" );

    if ( ( left_bracket_index >= 0 ) && ( right_bracket_index >= 0 )
        && ( ( right_bracket_index - left_bracket_index ) > 0 ) )  {
       chords_new.push( chordy_str.substring( left_bracket_index + 1, right_bracket_index ) );
       chordy_str = chordy_str.substring( right_bracket_index + 1 );
    } else
      parse_now = false;
  } // while
} // function

////////////////////////////////////////////////////////////////////////////////
function get_chord_comment_lines_agument() {
  const COMMENT_CHORDS             = "\n#chords:" ;
  const COMMENT_CHORDS_LENGTH      = 9 ;

  const COMMENT_CHORDS_NEW         = "\n#chords-new:" ;
  const COMMENT_CHORDS_NEW_LENGTH  = 13 ;

  var comment_chord_new_index_start = 0; // index in song_buffer
  var comment_chord_new_index_end   = 0; // index in song_buffer

  var comment_chord_index_start =
        song_buffer[ 0 ].indexOf( COMMENT_CHORDS );
  var tmp_str =
        song_buffer[ 0 ].substring( comment_chord_index_start + COMMENT_CHORDS_LENGTH );
  var tmp_str_EOL_pos = tmp_str.indexOf( "\n" );

if ( DEBUGGING_MODE ) {
console.log( "/*----------------------------tmp_str is:" );
console.log( tmp_str );
console.log( "---------------------------------------*/");
}
  var comment_chord_index_end =  comment_chord_index_start
                               + COMMENT_CHORDS_LENGTH
                               + tmp_str_EOL_pos;

  comment_chord_lines_argument_old = tmp_str.substring( 0, tmp_str_EOL_pos );

if ( DEBUGGING_MODE ) {
console.log( "/*----------------------------comment_chord_lines_argument_old:" );
console.log( comment_chord_lines_argument_old );
console.log( "-------------------------------------------------------------*/");
}
  extract_chords_old( comment_chord_lines_argument_old ); // get old chords list

  comment_chord_new_index_start =
    song_buffer[ 0 ].indexOf( COMMENT_CHORDS_NEW );
  tmp_str =
    song_buffer[ 0 ].substring( comment_chord_new_index_start + COMMENT_CHORDS_NEW_LENGTH );
  tmp_str_EOL_pos = tmp_str.indexOf( "\n" );

if ( DEBUGGING_MODE ) {
console.log( "/*----------------------------tmp_str is:" );
console.log( tmp_str );
console.log( "---------------------------------------*/");
}
  comment_chord_new_index_end =  comment_chord_new_index_start
                               + COMMENT_CHORDS_NEW_LENGTH
                               + tmp_str_EOL_pos;

  comment_chord_lines_argument_new = tmp_str.substring( 0, tmp_str_EOL_pos );

if ( DEBUGGING_MODE ) {
console.log( "/*----------------------------comment_chord_lines_argument_new:" );
console.log( comment_chord_lines_argument_new );
console.log( "-------------------------------------------------------------*/");
}
  extract_chords_new( comment_chord_lines_argument_new ); // list new chords

 // #chords: and #chords-new: can be anywhere in .pro file and in any order.
 if ( comment_chord_index_start < comment_chord_new_index_start )
   song_buffer[ 1 ] =
   song_buffer[ 0 ].substring( 0, comment_chord_index_start )
 + song_buffer[ 0 ].substring( comment_chord_index_end, comment_chord_new_index_start )
 + song_buffer[ 0 ].substring( comment_chord_new_index_end ) ;
 else
   song_buffer[ 1 ] =
   song_buffer[ 0 ].substring( 0, comment_chord_new_index_start )
 + song_buffer[ 0 ].substring( comment_chord_new_index_end, comment_chord_index_start )
 + song_buffer[ 0 ].substring( comment_chord_index_end ) ;

if ( DEBUGGING_MODE ) {
console.log( "indexes are:", comment_chord_index_start, comment_chord_index_start_end,
comment_chord_new_index_start, comment_chord_new_index_end );
}
} // function

////////////////////////////////////////////////////////////////////////////////
function create_chord_substitutions() {
  var chords_length     = chords.length;
  var chords_new_length = chords_new.length;
  var i = 0;

  if ( chords_length == 0 )      return false;
  if ( chords_new_length == 0 )  return false;

if ( DEBUGGING_MODE ) {
console.log( "chords_length is    :", chords_length );
console.log( "chords_new_length is:", chords_new_length );
}
  if ( chords_length == chords_new_length )
    for ( i = 0; i < chords_length; i++ )
      chords_XXX.push( "[WX" + chords[ i ] + "YZ]" );
  else return false;

  return true;
} // function

////////////////////////////////////////////////////////////////////////////////
function chord_substitutions_normal_to_XXX() {
  var i = 0; var k = 0;
  var number_of_chords = chords.length;
  var str1, str2 = "" ;

if ( DEBUGGING_MODE ) {
console.log( "chord_substitutions_normal_to_XXX(), number of chords is:", number_of_chords );
}
  for ( i = 0; i < number_of_chords; i++ ) {
//    str1 = "/\[" + chords[ i ] + "\]/g" ; Cannot use regular expression here.
    str1 = "[" + chords[ i ].toString() + "]" ;
    str2 = chords_XXX[ i ].toString() ;

if ( DEBUGGING_MODE )  console.log( "replacing", str1, "with", str2 );

    for ( k = 0; k < 100; k++ )
    song_buffer[ 2 ] = song_buffer[ 2 ].replace( str1, str2 );
//    song_buffer[ 2 ].replace( /\[A\]/g, str2 );
  }
} // function

////////////////////////////////////////////////////////////////////////////////
function chord_substitutions_XXX_to_new() {
  var i = 0; var k = 0;
  var number_of_chords = chords.length;
  var str1, str2 = "" ;
  var song_buffer_old = "" ;
  var continue_substitution = false;

  for ( i = 0; i < number_of_chords; i++ ) {
    str1 = chords_XXX[ i ] ;
    str2 = "[" + chords_new[ i ] + "]" ;

if ( DEBUGGING_MODE )  console.log( "replacing", str1, "with", str2 );

    continue_substitution = true;
    while ( continue_substitution ) {
      song_buffer_old = song_buffer[ 3 ];
      song_buffer[ 3 ] = song_buffer[ 3 ].replace( str1, str2 );

      if ( song_buffer_old == song_buffer[ 3 ] )
        continue_substitution = false;
    } // while
  } // for
} // function

////////////////////////////////////////////////////////////////////////////////
function process_final_output() {
  fs.writeFileSync( out_file_pro,
      song_buffer[ 3 ]
    + "#chords-old: " + comment_chord_lines_argument_old + "\n"
    + "#chords:     " + comment_chord_lines_argument_new + "\n" );
}

////////////////////////////////////////////////////////////////////////////////
// **** Main Processing Program Here ****
////////////////////////////////////////////////////////////////////////////////
if ( fix_filenames() ) {
  song_buffer[ 0 ] = fs.readFileSync( in_file_pro, 'utf8' ); // critical utf8 parameter

  get_chord_comment_lines_agument();

if ( DEBUGGING_MODE ) {
  console.log( "#chords    : is:", comment_chord_lines_argument_old );
  console.log( "#chords-new: is:", comment_chord_lines_argument_new );

  console.log( "chords    :", chords );
  console.log( "chords_new:", chords_new );

  console.log( "/*song_buffer0---------------------"); // good
  console.log( song_buffer[ 0 ] );
  console.log( "_________________________________*/");

  console.log( "/*song_buffer1---------------------"); // good
  console.log( song_buffer[ 1 ] );
  console.log( "_________________________________*/");
}

  if ( create_chord_substitutions() ) {

if ( DEBUGGING_MODE ) {
console.log( "    chords:", chords );
console.log( "chords_XXX:", chords_XXX ); // good
}
    song_buffer[ 2 ] = song_buffer[ 1 ];
    chord_substitutions_normal_to_XXX()

if ( DEBUGGING_MODE ) {
console.log( "/*song_buffer2---------------------");
console.log( song_buffer[ 2 ] );
console.log( "_________________________________*/");
}
    song_buffer[ 3 ] = song_buffer[ 2 ];
    chord_substitutions_XXX_to_new();

if ( DEBUGGING_MODE ) {
console.log( "/*song_buffer3---------------------");
console.log( song_buffer[ 3 ] );
console.log( "_________________________________*/");
}

    process_final_output();

  } else
    console.log( "Check #chords: and #chords-new lines." );

} // if fix_filenames
