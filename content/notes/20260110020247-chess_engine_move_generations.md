+++
title = "Chess Engine Move Generations"
date = 2026-01-10
updated= 2026-03-07
+++

## Types of Moves {#types-of-moves}

Moves can divided into two categories

-   pseudo-legal: obeys chess movement rules, but does not account for the king being in check
-   legal: like pseudo-legal, but checks if the king is in check

Move generation can verified using **pertf**, which is program which generates all moves from
a given position to a given depth. This is then compared with an existing engine to verify
move generation correctness.


## Bitboard Move Generation {#bitboard-move-generation}

Since bitboards are the preferred representation, this
part will only show move generation for bitboards.

-   [Chess Engine Pawns](@/notes/20260110021336-chess_engine_pawns.md)
