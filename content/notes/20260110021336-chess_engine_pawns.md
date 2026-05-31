+++
title = "Chess Engine Pawns"
date = 2026-01-10
updated= 2026-05-31
+++

Pawn move generation using bitboards. For pawn pushes (moving pawn forward), we
can implement this by shifting the bitboard up (for white pawns), and then
taking the intersection of the empty board (to ensure no piece is blocking the
push). Note that pawns in their starting position can move up two squares.

```c
U64 wSinglePushTargets(U64 wpawns, U64 empty) {
        return nortOne(wpawns) & empty;
}

U64 wDblPushTargets(U64 wpawns, U64 empty) {
          const U64 rank4 = C64(0x00000000FF000000);
        U64 singlePushs = wSinglePushTargets(wpawns, empty);
        // if a pawn is not in the fourth rank after double pushing,
        // then it is not in its starting position and therefore
        // not allowed to move two squares
        return nortOne(singlePushs) & empty & rank4;
}

U64 bSinglePushTargets(U64 bpawns, U64 empty) {
        return soutOne(bpawns) & empty;
}

U64 bDoublePushTargets(U64 bpawns, U64 empty) {
        const U64 rank5 = C64(0x000000FF00000000);
        U64 singlePushs = bSinglePushTargets(bpawns, empty);
        return soutOne(singlePushs) & empty & rank5;
}
```

We use separate implementations for optimization. To check beforehand if a pawn
is allowed to push, shift the empty board in the reverse direction, and if the
pawn is there, that means it can push

```c
U64 wPawnsAble2Push(U64 wpawns, U64 empty) {
        return soutOne(empty) & wpawns;
}

U64 wPawnsAble2DblPush(U64 wpawns, U64 empty) {
        const U64 rank4 = C64(0x00000000FF000000);
        U64 emptyRank3 = soutOne(empty & rank4) & empty;
        return wPawnsAble2Push(wpawns, emptyRank3);
}
```

For attacks, since pawns attack diagonally we can shift the bitboards of the
pawns diagonally one square

```c
U64 wPawnEastAttacks(U64 wpawns) {return noEaOne(wpawns);}
U64 wPawnWestAttacks(U64 wpawns) {return noWeOne(wpawns);}

U64 bPawnEastAttacks(U64 bpawns) {return soEaOne(bpawns);}
U64 bPawnWestAttacks(U64 bpawns) {return soWeOne(bpawns);}

U64 wPawnAnyAttacks(U64 wpawns) {
        return wPawnEastAttacks(wpawns) | wPawnWestAttacks(wpawns);
}

U64 wPawnDblAttacks(U64 wpawns) {
        return wPawnEastAttacks(wpawns) & wPawnWestAttacks(wpawns);
}

U64 wPawnSingleAttacks(U64 wpawns) {
        return wPawnEastAttacks(wpawns) ^ wPawnWestAttacks(wpawns);
}
```

For efficiency, we precomputed attacks from a given position into an array, and
then by intersecting that with the bitboard of black pieces we can determine if
a capture is possible, like the following

```c
whitePawnAttacks = arrPawnAttacks[white][sqOfWhitePawn];
if (whitePawnAttacks & pieceBB[black]) -> pseudo legal captures possible
```

En passant is kind of difficult to implement. Note that a pawn can only be captured
via en passant if if double-moved, and if there are enemy pawns next to it.
