+++
title = "Chess Engine Bitboards"
date = 2026-01-10
updated= 2026-05-31
+++

Uses a 64 bit to hold information. In general, you would have two bitboards (one
for white and one for black) for each piece type. On the bitboard, if a square
is occupied than it is marked with a 1.

Bitboards have the advantage of using bit-twiddling to generate moves which
takes very few instructions and is also very fast.
