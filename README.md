# ember-build-diff

Compare the instrumented output of 2 Ember.js builds

## Current Status

Copied some scripts here from [my dotfiles](https://github.com/mikrostew/dotfiles/tree/master/node) in order to make this more usable for other folks.

These are some rough scripts that analyze the output `instrumentation.*.json` files generated from running `BROCCOLI_VIZ=1 ember build`. They are not very user-friendly at the moment.

## The Goal

Make this as simple to use as possible. The interface should be something like:

`./ember-build-diff <SHA> [extra ember options]` (assume diff with previous commit)

or

`./ember-build-diff <SHA1> <SHA2> [extra ember options]`

And that's it - this will automatically run a build for each commit (forwarding any extra options to ember, if you need that). Then it will process the generated files and produce a nice graph/table/image/TBD that shows the changes between those 2 builds.
