#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    if [ "$HUSKY_DEBUG" = "1" ]; then
      echo "husky (debug) - $1"
    fi
  }

  readonly hook_name="$(basename "$0")"
  debug "running $hook_name"

  if [ -f /dev/stdin ]; then
    cat /dev/stdin
  fi > "$1"
  # add Husky 4 and 5 compatibility
  readonly husky_4_file="$PWD/.husky/$hook_name.old"
  if [ -f "$husky_4_file" ]; then
    debug "running $hook_name.old"
    . "$husky_4_file"
  fi
  exit $?
fi
