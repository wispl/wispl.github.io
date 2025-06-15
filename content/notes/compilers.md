---
title: Compilers
date: 2025-01-13
---

# Crafting Interpreters Notes

[let's build a compiler](https://compilers.iecc.com/crenshaw/)
[cs 6120](https://www.cs.cornell.edu/courses/cs6120/2020fa/self-guided/)

## Overview

1. lexing/scanning: source into tokens
2. parsing: tokens into AST trees
3. static analysis: AST trees into Intermediate Representation (IR)

**static analysis** involves binding/resolution to resolve identifiers taking into account scope.

## Intermediate Representation (IR)
An interface between the source and the machine, allows sources to be transformed into
an intermediate layer which can then be implemented by each back end for target platform.

IR can be either a data structure or tuple or stack based code:

* Control flow graph is a graph data structure (CPython does this)
* Three-address code is a stack based code and is commonly used.
* Three-address code: `x := i + y`
* Tuple-based:        `(ADD, x, i, y)`
* could be static-single assignment (assigned before using) or continuation-passing style
* also important for optimizations

### Code generation and Back end

From here, the IR can either be converted into machine code or into bytecode.

Machine code can be directly executed by the OS but requires translating directly
into instructions, which can vary by platform.

Bytecode is ran by a VM targeting a hypothetical chip the bytecode targets. This
is less performant than machine code but is simpler and more portable.

### Runtime

Progams typically need other services running, such as a GC or some form of mapping of
object to types. This runtime is embedded directly into the compiled source or in the
interpreter or VM.

### Deviations

Single-pass compilers perform parsing, analysis and code gen in one step. They are
faster and simpler but place constraints on the language

Tree-walk interpreters run the code as soon as an AST is available, simple but slow.

Transpilers perform the full front end part, but then outputs the source in a target
lanaguage and let them handle the rest. There might be optimizations and more analysis
if the languages are not too similar.

Just-in-time compilation converts bytecode into machine code once the it is loaded.
More advanced languages might alter the bytecode during runtime for optimizations (JVM).

### Interpreters vs Compilers

Compilers transform source into a lower form, an interpreter directly executes the source.
Not mutually exclusive, most languages have both (python, javascript, c#, etc.)
Some like ruby are only interpreters, while C are only compilers.
