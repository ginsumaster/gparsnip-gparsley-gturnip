###############################################################################
# gp-c.pro
# Chordpro unit tests: {c:} {comment:}
# v0.9
# meta-tag is for lyric-line comments to musicians
# printing of comments only in chord-lyrics and chord-lyrics-html versions
# no printing in lyrics-only and lyrics-only-html versions
#
# in chord-lyrics-html version, comment words are in different color.
{title:---------------------------------------gp-c}
-----------------------------------------------------------------------Test 01
[A]Alpha{comment:comment1}

# A
# Alphacomment1
-----------------------------------------------------------------------Test 02
[A]Alpha {c:comment1}

# A
# Alpha comment1
-----------------------------------------------------------------------Test 03
[A]Alpha  {comment:comment1}

# A
# Alpha  comment1
-----------------------------------------------------------------------Test 04
[A]Alpha [B]{c:comment1}

# A     B
# Alpha comment1
-----------------------------------------------------------------------Test 05
[A]Alpha [B] {c:comment1}

# A     B
# Alpha    comment1
-----------------------------------------------------------------------Test 06
{comment:comment1}[A]Alpha{c:comment2}

#         A
# comment1Alphacomment2
-----------------------------------------------------------------------Test 07
{c:comment1} [A]Alpha {c:comment2}

#          A
# comment1 Alpha comment2
-----------------------------------------------------------------------Test 08
{c:comment1} [A]Alpha [B]{c:comment2}

#          A     B
# comment1 Alpha comment2
-----------------------------------------------------------------------Test 09
{c:comment1} [A] Alpha Bravo [C]{c:comment2}

#          A             C
# comment1   Alpha Bravo comment2
-----------------------------------------------------------------------Test 10
{c:comment1}[AMaj7]AlphA[B]Bravo{c:comment2}

#         AMaj7  B
# comment1AlphA- Bravocomment2
-----------------------------------------------------------------------Test 11
{c:comment1}[AMaj]AlphA[B]Bravo{c:comment2}

#         AMaj  B
# comment1AlphA-Bravocomment2
-----------------------------------------------------------------------Test 12
{c:comment1}[AM]AlphA[B]Bravo{c:comment2}

#         AM   B
# comment1AlphABravocomment2
-----------------------------------------------------------------------Test 13
{c:comment1} [AM]AlphA[B]Bravo{c:comment2}

#          AM   B
# comment1 AlphABravocomment2
-----------------------------------------------------------------------Test 14
[A]Alpha [B]{c:comment1} [C]{c:comment2}

# A     B        C
# Alpha comment1 comment2
-----------------------------------------------------------------------Test 15
[A]Alpha [B][C]{c:comment1} [D][E]{c:comment2}

# A     B  C     D  E
# Alpha comment1 comment2
-----------------------------------------------------------------------Test 16
[A]Alpha [BMaj][C]{c:comment1} [DMaj13][E]{c:comment2}

# A     BMaj  C  DMaj13  E
# Alpha comment1 comment2
-----------------------------------------------------------------------Test 17
[A]Alpha [BMaj7][C]{c:comment1} [DMaj13][E]{c:comment2}

# A     BMaj7  C  DMaj13  E
# Alpha comment1  comment2
-----------------------------------------------------------------------Test 18
[A]Alpha [BMaj13][C]{c:comment1} [DMaj13][E]{c:comment2}

# A     BMaj13  C  DMaj13  E
# Alpha comment1   comment2
-----------------------------------------------------------------------Test 19
[A]Alpha [BMaj][C]{c:comment1}  [DMaj13][E]{c:comment2}

# A     BMaj  C   DMaj13  E
# Alpha comment1  comment2
-----------------------------------------------------------------------Test 20
[A]Alpha [BMaj13][C]{c:comment1}  [DMaj13][E]{c:comment2}

# A     BMaj13  C   DMaj13  E
# Alpha comment1    comment2
-----------------------------------------------------------------------Test 21
{c:comment1}alpha [B]Bravo

#               B
# comment1alpha Bravo
-----------------------------------------------------------------------Test 22
{c:comment1} alpha [B]Bravo

#                B
# comment1 alpha Bravo
-----------------------------------------------------------------------Test 23
{c:comment1} alph[A]a [B]Bravo

#              A  B
# comment1 alphA  Bravo
-----------------------------------------------------------------------Test 23
[A]Al{c:comment1}pha [B]Bravo

# A           B
# Al comment1 Bravo
