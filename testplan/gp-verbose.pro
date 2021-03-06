###############################################################################
# TESTS - verbose chord line
# i.e. a line that starts with "|" and only has chords in it.
#
{title:---------------------------------------gp-verbose}
-----------------------------------------------------------------------Test 01
| [A]     | [B]     |

# <no line>
# | A     | B     |
-----------------------------------------------------------------------Test 02
 | [A]     | [B]     |

#    A      B
#  |      |      |
-----------------------------------------------------------------------Test 03
| [A]     | [B]

# <no line>
# | A     | B
-----------------------------------------------------------------------Test 04
||: [A]     | [B]     :||

# <no line>
# ||: A     | B     :||
-----------------------------------------------------------------------Test 05
| [A] Alpha | [B] Bravo |

# <no line>
# | A Alpha | B Bravo |
