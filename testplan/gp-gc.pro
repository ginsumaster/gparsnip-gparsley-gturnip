###############################################################################
# gp-gc.pro
# Chordpro unit tests: {gc:} {guitar_comment:}
# v0.9
# meta-tag is for chord-line comments to musicians
# printing of comments only in chord-lyrics and chord-lyrics-html versions
# no printing in lyrics-only and lyrics-only-html versions
#
# in chord-lyrics-html version, comment words are in different color.
{title:---------------------------------------gp-gc}
-----------------------------------------------------------------------Test 01
{gc:T:} [A]Alpha [B]Bravo

# T: A     B
#    Alpha Bravo
-----------------------------------------------------------------------Test 02
[A]Alpha {gc:To C: }[A] {guitar_comment:To V:}[B]

# A     To C: A  To V:B
# Alpha
-----------------------------------------------------------------------Test 03
[A]Alpha {gc:C:}[A] {gc:V:}[B]

# A     C:A  V:B
# Alpha
-----------------------------------------------------------------------Test 04
[A]Alpha{guitar_comment:comment1}

# A    comment1
# Alpha
-----------------------------------------------------------------------Test 05
[A]Alpha {gc:comment1}

# A     comment1
# Alpha
-----------------------------------------------------------------------Test 06
[A]Alpha [B]{gc:comment1}

# A     B  comment1
# Alpha
-----------------------------------------------------------------------Test 07
[A]Alpha [B] {gc:comment1}

# A     B  comment1
# Alpha
-----------------------------------------------------------------------Test 08
{gc:comment1}[A]Alpha{gc:comment2}

# comment1A    comment2
#         Alpha
-----------------------------------------------------------------------Test 09
{gc:comment1} [A]Alpha{gc:comment2}

# comment1 A    comment2
#          Alpha
-----------------------------------------------------------------------Test 10
{gc:comment1} [A] bravo charlie [D]{gc:comment2}

# comment1 A                D  comment2
#             bravo charlie
-----------------------------------------------------------------------Test 11
[A]Alpha [B] {gc:comment1} [C]{gc:comment2}

# A     B  comment1 C  comment2
# Alpha
-----------------------------------------------------------------------Test 12
[A]Alpha [B]  {gc:comment1}  [C]  {gc:comment2}

# A     B  comment1  C   comment2
# Alpha
-----------------------------------------------------------------------Test 13
[A]Alpha {gc:comment1} [C][D] {gc:comment2} [E][F]

# A     comment1 C  D  comment2 E  F
# Alpha
-----------------------------------------------------------------------Test 14
[A]Alpha {gc:comment1} [C][D] {gc:comment2 }[E][F]Foxtrot

# A     comment1 C  D  comment2 E  F
# Alpha                            Foxtrot
-----------------------------------------------------------------------Test 15
[A]Alpha {gc:comment1}[B][C]{gc:comment2  }[D][E]Echo

# A     comment1B  C  comment2  D  E
# Alpha                            Echo
-----------------------------------------------------------------------Test 16
[A]Alpha {gc:comment1}[B][C]{gc:comment2  }[D][E]Echo [F]Foxtrot

# A     comment1B  C  comment2  D  E    F
# Alpha                            Echo Foxtrot
-----------------------------------------------------------------------Test 17
{gc:comment1}alpha [B]Bravo

# comment1       B
#          alpha Bravo
-----------------------------------------------------------------------Test 18
{gc:comment1} alpha [B]Bravo

# comment1        B
#           alpha Bravo
-----------------------------------------------------------------------Test 19
{gc:comment1} alph[A]A [B]Bravo

# comment1      A  B
#           alphA  Bravo
