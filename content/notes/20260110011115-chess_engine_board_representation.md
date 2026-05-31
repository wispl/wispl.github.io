+++
title = "Chess Engine Board Representation"
date = 2026-01-10
updated= 2026-05-31
+++

## Basics {#basics}

The board representation is simply how the board is represented. This is split
into two main types


### Piece Centric {#piece-centric}

This representation answers the following question: for a given piece, what
square is it at?

[Chess Engine Bitboards](@/notes/20260110013017-chess_engine_bitboards.md) are the preferred choice.

Piecelists and Piecesets are alternative implementations using a list or set
to hold the pieces

-   piecelists: array or list with 32 pieces, holding their square information
-   piecesets: uses bits in 32 bit word to point to index in piecelist

References

-   <https://www.chessprogramming.org/Piece-Lists>
-   <https://www.chessprogramming.org/Piece-Sets>


### Square Centric {#square-centric}

This representations answers the following question: for a given square, what
piece is on it?

Mailbox is main way to do this, and simply means a memory location holds
some information about the square. The main way is to simply use a large
array

-   8x8 board: [Chess Engine 8x8](@/notes/20260110015928-chess_engine_8x8.md)
-   10x12 board: the extra rows and columns serve as sentinels to notify when a
    piece goes off the board as the result of an attack
-   vector attacks: encodes into a table how a piece may move using vectors
-   0x88 (16x8 board): uses the upper bit to determine out of board pieces,
    compliments vector attacks

References:

-   <https://www.chessprogramming.org/10x12_Board>
-   <https://www.chessprogramming.org/Vector_Attacks>
-   <https://www.chessprogramming.org/0x88>


### Hybrid {#hybrid}

While an engine can focus on one representation, it will also use the other
representation as well. For example

-   bitboard-based might also use 8x8 board
-   8x8 might also use piece-lists
