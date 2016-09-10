/*******************************************************************************
GTurnip -- ChordPro Song Transposer / Chord Substitution

SUMMARY: Program takes a ChordPro -encoded plain text file
  and does chord transposing/ substitution.

PHILOSOPHY: Do it (W)RIGHT, Do it Once

INPUT:
song.pro  ( Unix/Linux LF style, UTF-8 encoded)
song.cd1  ( chords used in song.pro, vertical-line-delimited )
song.cd2  ( substitution chords, vertical-line-delimited )

OUTPUT:
song-NEW.pro ( new song.pro with chord substitutions )

TO USE:
ls
song.pro
song.cd1
song.cd2
cat song.cd1
|C|Dm|Em|F|G|Am|
cat song.cd2
|D|Em|F#m|G|A|Bm|
nodejs gturnip song.pro
ls
song.pro
song-new.pro

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
Complete rewrite: -- now uses .cd1 and .cd2 as input files
Aborting v1.3 feature add

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
  2. read in old chords and new chords
  3. use find and replace string methods to replace chords.
     A. find original chord
     B. replace original chord with intermediate chord
     C. replace intermediate chord with final chord
  4. Write out results.

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
*/
var fs                    = require( 'fs' ); // read from filesystem
var in_file_noext         = process.argv[ 2 ] ;
var in_file_pro           = process.argv[ 2 ] + ".pro" ; //chordpro source file
var in_file_cd1           = process.argv[ 2 ] + ".cd1" ; // old chords
var in_file_cd2           = process.argv[ 2 ] + ".cd2" ; // new chords
var out_file_pro          = process.argv[ 2 ] + "-NEW.pro" ; // new file

var chords_old = [];   // old chords list -- no brackets
var chords_XXX = [];   // intermediate chords for transposing [WX..YZ]
var chords_new = [];   // new chords list -- no brackets

var chords_old_buffer = "" ; // in_file_cd1 contents
var chords_new_buffer = "" ; // in_file_cd2 contents
var delimiter_pos     = 0;   // delimiter is vertical bar/line

/* song_buffer:
   0 -- original .pro file from disk
   1 -- pro file w/ intermediate substitution chords
   2 -- pro file w/ new chords, output-ready */
var song_buffer = [ "" , "" , "" ]; // entire song contents

//const MAX_J  = 50;
var number_of_chord_substitutions = 0;
var i, j     = 0;
var st1, st2 = "" ; // substitution strings

////////////////////////////////////////////////////////////////////////////////
// **** Main Processing Program Here ****
if ( fix_filenames() ) {
  song_buffer[ 0 ]  = fs.readFileSync( in_file_pro, 'utf8' ); // critical utf8 parameter
  chords_old_buffer = fs.readFileSync( in_file_cd1, 'utf8' );
  chords_new_buffer = fs.readFileSync( in_file_cd2, 'utf8' );

  chords_old_buffer     = chords_old_buffer.substring( 1 ); // remove first bar
  do {
    delimiter_pos       = chords_old_buffer.indexOf( "|" ); // find first bar
    if ( delimiter_pos >= 0 ) {
      chords_old.push(    chords_old_buffer.substring( 0, delimiter_pos ) );
      chords_old_buffer = chords_old_buffer.substring( delimiter_pos + 1 );
    } // if
  } while ( delimiter_pos >= 0 );

  chords_new_buffer     = chords_new_buffer.substring( 1 ); // remove first bar
  do {
    delimiter_pos       = chords_new_buffer.indexOf( "|" ); // find first bar
    if ( delimiter_pos >= 0 ) {
      chords_new.push(    chords_new_buffer.substring( 0, delimiter_pos ) );
      chords_new_buffer = chords_new_buffer.substring( delimiter_pos + 1 );
    } // if
  } while ( delimiter_pos >= 0 );

  number_of_chord_substitutions = chords_old.length;

  if ( number_of_chord_substitutions != chords_new.length ) {
    console.log( "ERROR: cd1 and cd2 - need 1-to-1 chord matches");
    console.log( "ABORTING" );
  } else {
    song_buffer[ 1 ] = song_buffer[ 0 ];

    for ( i = 0; i < number_of_chord_substitutions; i++ )
      chords_XXX.push( "[WX" + chords_old[ i ] + "YZ]" );

    for ( i = 0; i < number_of_chord_substitutions; i++ ) {
      //    str1 = "/\[" + chords[ i ] + "\]/g" ; Cannot use regular expression here.
      str1 = "[" + chords_old[ i ].toString() + "]" ;
      str2 =       chords_XXX[ i ].toString() ;

/*      for ( j = 0; j < MAX_J; j++ )
        song_buffer[ 1 ] = song_buffer[ 1 ].replace( str1, str2 );
      // song_buffer[ 1 ].replace( /\[A\]/g, str2 ); */
      do {
        j = song_buffer[ 1 ].toString().indexOf( str1 );
        if ( j >= 0 )
          song_buffer[ 1 ] = song_buffer[ 1 ].replace( str1, str2 );
      } while ( j >= 0 );

    } // for i

    song_buffer[ 2 ] = song_buffer[ 1 ];

    for ( i = 0; i < number_of_chord_substitutions; i++ ) {
      str1 =       chords_XXX[ i ].toString() ;
      str2 = "[" + chords_new[ i ].toString() + "]" ;

/*      for ( j = 0; j < MAX_J; j++ )
        song_buffer[ 2 ] = song_buffer[ 2 ].replace( str1, str2 );
//        song_buffer[ 2 ].replace( /\[A\]/g, str2 ); */
      do {
        j = song_buffer[ 2 ].toString().indexOf( str1 );
        if ( j >= 0 )
          song_buffer[ 2 ] = song_buffer[ 2 ].replace( str1, str2 );
      } while ( j >= 0 );

    } // for i

    fs.writeFileSync( out_file_pro, song_buffer[ 2 ] );
  } // else number_of_chord_substitutions

} // if fix_filenames
else
  console.log( "Can't find file: ", in_file_pro );

////////////////////////////////////////////////////////////////////////////////
function fix_filenames() {
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
      in_file_pro   = in_file_string;    // have to initialize vars
      in_file_noext = in_file_string.substring( 0, dot_pos );
      out_file_pro  = in_file_noext + "-NEW.pro" ;
      in_file_cd1   = in_file_noext + ".cd1" ;
      in_file_cd2   = in_file_noext + ".cd2" ;
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
