+++
title = "Structure Packing"
date = 2026-06-08
updated= 2026-06-20
+++

## Introduction {#introduction}

Rearranging members of a struct can reduce the memory usage of a struct. Very weird. The two big players in how the size of a struct changes is **padding** and **alignment**. These notes heavily uses [this](https://www.catb.org/esr/structure-packing/) as a reference. Note that these notes apply to other compiled languages as well (like Rust).


## Alignment {#alignment}

Alignment dictates what byte address a data type starts on. This is dependent on the size of the data type (signed or unsigned do not matter)

-   one byte (char): any byte address
-   two bytes (shorts): even byte addresses
-   four bytes (ints or floats): address divisible by four
-   eight bytes (longs or doubles): address divisible by eight
-   pointers: address divisible by 32 or 64 (depends on pointer size of ISA)

The main purpose of this alignment is to speed up memory access. When data types are aligned like this, they are referred to as being **self-aligned**. Self-aligned types require only a single-instruction fetch while non-aligned types will require multiple fetches due to crossing the machine word boundary.

Note that self-alignment generally occurs on modern ISAs like Intel, ARM, and RISC-V, older ones might not have such rules. And the rules could also differ for the older ones as well if they do have similar rules.


## Padding {#padding}

Since alignment dictates where a datatype starts, padding must be used to ensure the alignment rules are satisfied. Consider the following (on a RISC-V ISA)

```c
char *p; // four bytes
char c;  // one byte
int x;   // four bytes
```

Notice that the integer will start on the 6th byte, which fails alignment rules. In order for alignment rules to be satisfied, address divisible by four because the integer is four bytes, it must start on the 8th byte, so we must pad three bytes in, resulting in

```c
char *p;        // four bytes
char c;         // one byte
char padding[3] // three bytes
int x;          // four bytes
```

But if you ordered it such that the largest datatype comes first, you will have

```c
char *p;        // four bytes
int x;          // four bytes
char c;         // one byte
```

And no padding is used. In general, it seems to that _ordering the declarations from largest to smallest is generally the best in terms of space savings_.

<div class="NOTE">

The C standard does not guarantee the order of the declarations is the order the bytes are placed in, but it seems that this ordered behavior seems to be usually correct.

</div>


## Struct Alignment {#struct-alignment}

The struct is also aligned in addition to its members, though that is to be expected since the struct creates a datatype too.
