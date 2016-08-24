###############################################################################
# TESTS - {soh} {eoh}
# 1. text between soh-eoh tags print in all output files.
# 2. in html output, soh-eoh show up as highlighted text
# 3. in html output, if line starts with soh -- then entire line
#    is considered a musical passage and has highlighting and
#    special background color.
---------------------------------------gp-soh
-----------------------------------------------------------------------Test 01
{soh}Chorus:{eoh}
[A]Alpha [B]Bravo [C]Charlie

# Chorus:
# A     B     C
# Alpha Bravo Charlie
-----------------------------------------------------------------------Test 02
{soh}Chorus:{eoh}[A]

#        A
# Chorus:
-----------------------------------------------------------------------Test 03
 {soh}Chorus:{eoh}[A]

#         A
#  Chorus:
-----------------------------------------------------------------------Test 04
{soh}Chorus:{eoh} Alpha

# <no line>
# Chorus: Alpha
-----------------------------------------------------------------------Test 05
Alpha {soh}Chorus:{eoh}

# <no line>
# Alpha Chorus:
-----------------------------------------------------------------------Test 06
{soh}T:{eoh} [A]Alpha [B]Bravo

#    A     B
# T: Alpha Bravo
-----------------------------------------------------------------------Test 07
{soh}T:{eoh}[A]Alpha [B]Bravo

#   A     B
# T:Alpha Bravo
-----------------------------------------------------------------------Test 08
[A]Alpha [B]Bravo {soh}T:{eoh} [C]Charlie

# A     B        C
# Alpha Bravo T: Charlie
-----------------------------------------------------------------------Test 09
[A]Alpha {soh}T:{eoh}[B]Bravo [C]Charlie

# A       B     C
# Alpha T:Bravo Charlie
-----------------------------------------------------------------------Test 10
[A]Alpha {soh}T:{eoh} [B]Bravo [C]Charlie

# A        B     C
# Alpha T: Bravo Charlie
-----------------------------------------------------------------------Test 11
[A]AlphA{soh}Bravo{eoh} [C]Charlie

# A
# AlphaBravo Charlie
-----------------------------------------------------------------------Test 12
[A]AlphA{soh}BravO{eoh}[C]Charlie

# A         C
# AlphaBravOCharlie
-----------------------------------------------------------------------Test 13
[A]AlphA{soh}BravO{eoh}CharliE[D]Delta

# A                D
# AlphaBravOCharliEDelta
