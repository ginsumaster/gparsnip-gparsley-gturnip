###############################################################################
# gp-meta.pro
# Chordpro unit tests: basic (fake) meta-tag tests
# v0.9
# bad meta-tags should be ignored completely
# however, they do serve as delimiters when parsing
---------------------------------------gp-meta
-----------------------------------------------------------------------Test 01
[A]Alpha [B]Bravo {meta-tag-here:foo}

# A     B
# Alpha Bravo
-----------------------------------------------------------------------Test 02
[A]Alpha [B]Bravo{meta-tag-here:foo}

# A     B
# Alpha Bravo
-----------------------------------------------------------------------Test 03
{meta-tag-here:foo}[A]Alpha [B]Bravo

# A     B
# Alpha Bravo
-----------------------------------------------------------------------Test 04
{meta-tag-here:foo} [A]Alpha [B]Bravo

#  A     B
#  Alpha Bravo
-----------------------------------------------------------------------Test 05
[A]Alpha {meta-tag-here:foo} [B]Bravo

# A      B
# Alpha  Bravo
-----------------------------------------------------------------------Test 06
[A]Al{meta-tag-here:foo}pha [B]Bravo

# A     B
# Alpha Bravo
-----------------------------------------------------------------------Test 07
[A]{meta-tag-here:foo}Alpha [B]Bravo

# A     B
# Alpha Bravo
-----------------------------------------------------------------------Test 08
[A]Alpha {meta-tag-here:foo}[B]Bravo

# A     B
# Alpha Bravo
#
