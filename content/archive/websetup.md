---
title: Web Setup
date: 2024-08-09
updated: 2025-06-15
description: DIY site, or how I subjected myself to gymnastics create a website.
---

Edit: I started using Zola for site generation, having an actual templating
language which is simple makes things a lot easier and clearer. I also enjoyed
the simplicity of Zola as well, so overall, quite satisfied.

Notes for how to setup this website. Unfortunately or fortunately, no static
site generators were. No this is not hardcore, it is kind of brutal honestly.
There is less between me and the notes. Close to the metal kind of thing...
except I do not want to be close because the metal is a metal spike that is
web dev.

## Components

The core part of the setup is a lousy Makefile, whose main goal is to convert
markdown files into html files using `pandoc`. Yes, the page you are reading
right now used to be a markdown file. Horrifying. A lot of other static site
generators do something similar, though probably without `pandoc`.

The downsides of this `pandoc` method is likely speed and performance, but unless
I have thousands of notes, this should scale pretty well. And I can just throw
more threads at it. The bigger issue is indexing the notes.

Indexing is done through a small bash script `index_notes`, which simply reads notes in some
directory for a front matter. It then sorts the parsed front matter base on the
date. Finally it groups the metadata in the same years. As it groups them, it
generates html based on the data.

The final step is the hardest. We use `sed` to replace the string `{NOTES}` in
a html file which serves as a template, with the result of the `index_notes`
script. So the only dependencies are

* make
* sed (GNU)
* pandoc
* bash
* sort

Oh and there is also `index_archive` because for the blogs instead. The reason
is because notes don't really have a date since they are more of a living
document and prone to be edited compared with blogs.

## Templates

I like differentiating notes from more opinionated pieces. This one is
opinionated, yes. I keep pieces like this in `archive/` and notes in `notes/`.
And so in the Makefile there are

```make
NOTES := $(wildcard notes/*.md)
BLOGS := $(wildcard blogs/*.md)

ARCHIVE_INDEX := templates/archive.html
NOTES_INDEX := templates/notes.html
HTML := templates/template.html

CSS := style.css
```

The templates themselves are literally just html files. In particular,
`templates/template.html` is `pandoc` specific template. The rest are regular
html files with something like `{NOTE}` inside. Yes, `sed` is used as a poor
man's templates.

A call to `make all` turns all the notes and blogs into html and a call to
`make index` creates the `archive.html` and `notes.html` which holds links
to them.

## Process

So the steps for publishing are

1.  Write a .md file in the notes/blog directory, include the front matter (title and date)
2.  Run `make`
3.  Run `make index` only when adding or removing
4.  Profit?

## End

There a lot of cons with this setup, and I can definitely see why someone might
use actual static site generators instead.

* For one, the nav bar is duplicated in every single file. There like 6-7 files I have to edit manually
* The indexing is just not clean, duplicate logic is used to index the two types
* Actual templates will be awesome, especially since there are actual templating languages like nunjucks or liquid

Wit regards to templates, right now the indexing scripts are absolute
monstrosities to look at and debug. An actual template with support for
something like `foreach( note, do_this )` would come a long way.

The only benefit is the huge control I have over the stack. I might just explore
static site generators which are less intrusive when I can't take anymore.

11Ty seems like a good option?

:)
