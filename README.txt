gparsnip.js gparsley.js gturnip.js README.txt

---- SUMMARY:

Used together, these two utilities enable you to get from this:
  -- Misc collection of chordpro-encoded songs

To this:
  -- beautifully organized formatted song collection w/ table of contents html

gparsnip -- converts a plain-text ChordPro song.pro file to a clear, concise, accurate, formatted musician-ready song sheet.
  It generates these files:
  song.txt  -- chord-lyrics, plain text
  song.htm  -- chord-lyrics, web page
  song.lyr  -- lyrics, plain text
  song.html -- lyrics, web page
  song.csv  -- meta-tags info of song, tab-delimited
  song.cd1  -- list of chords used in the song, space-delimited

gparsley -- generates an index web page (index.html) of your songs using a info from a csv file ( index.csv )

gturnip -- utility to do chord transposes and substitutions on a song.pro file.


---- NOTES, 2016-08-23
gparsnip and gparsley are fully functional.

To see sample output, go to http://geocities.ws/sus

However, gturnip needs to be rewritten.
It current does transpositions, but:
1. It requires chord definitions inside the song.pro file:
  #chords: [A] [B] ..
  #chords-new: [B] [C] ..

I want the final version to instead rely on external files for the chord substitutions:
song.cd1, song.cd2
These files have space-delimited list of chords, original and new.

