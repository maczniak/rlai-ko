#!/usr/bin/env python
# This script removes LaTeX markups for spell checking.
#  It is not a general LaTeX markup stripper.

from __future__ import print_function
import fileinput
import re

patterns = {
    r'\\emph{(.*?)}': r'\1', # emph, url
    r'\\(text)?cite\*?{(.*?)}': r'\1', # *cite*
    r'\(.*?\)': r'', # paren
    r'\\(page)?ref{.*?}': r'6', # ref
    r"``(.*?)''": r'"\1"', # quot
    r'\\%': r'%', # escape
}

_patterns = {}
for pattern in patterns:
    _patterns[re.compile(pattern)] = patterns[pattern]

def process(text):
    for pattern in _patterns:
        text = pattern.sub(_patterns[pattern], text)
    return text

if __name__ == '__main__':
    text = ''
    for line in fileinput.input():
        if line == '\n':
            text = process(text)
            print(text)
            print()
            text = ''
        else:
            text = text + ' ' + line.strip()

