---
title: Algorithms
date: 2025-01-13
---

# Algorithms

## String

TODO:

* Aha-Corasick
* Z algorithm

### Knuth-Morris-Pratt (KMT)

[ref](refhttps://www.cambridge.org/core/journals/journal-of-functional-programming/article/knuthmorrispratt-illustrated/8EFA77D663D585B68630E372BCE1EBA4)
Usually when searching for a string, you start with the first letter and see if
the letters after it matches. This is repeated for each letter in a paragraph
for example.

KMT optimizes this by skipping the letters you have already scanned if it is impossible
for them to be the start of the letter. The number of letters skipped for a amount of
letters matched can be precomputed.

For example, one instance of matching the word "jackpot" in the sentence:
"Jack and James hit a jackpot."

1. search for 'j', found 'Jack', match jack but not pot, we can skip three letters now
2. search for 'j' again, found 'James', skip two letters
3. search for 'j' again, found jackpot.

There are some more details such as what if the word can still match, like 'elephant' and matching
'ele', in this case, we cannot skip three letters because the final 'e' might be the beginning of
'elephant'.

