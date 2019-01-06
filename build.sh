#!/bin/sh
set -e
cd "$(dirname "$0")"

opt_usage=false
opt_interactive=false
config_only=false
config_args=()

while [[ $# -gt 0 ]]; do case $1 in
  -h|-help|--help)
    opt_usage=true
    ;;
  -i)
    opt_interactive=true
    ;;
  -c)
    config_only=true
    ;;
  *)
    config_args+=( $1 )
    ;;
esac; shift; done

if $opt_usage; then
  echo "Builds $(basename "$PWD")" >&2
  echo "Usage: $0 [options]" >&2
  echo "" >&2
  echo "Options:" >&2
  echo "  -h   Show help and exit" >&2
  echo "  -O   Produce an optimized release build" >&2
  echo "  -i   Start an interactive session" >&2
  echo "  -c   Only configure build and then exit" >&2
  echo "" >&2
  echo "Examples:" >&2
  echo "  $0" >&2
  echo "    Configure & build debug products" >&2
  echo "" >&2
  echo "  $0 -O" >&2
  echo "    Configure & build release products" >&2
  echo "" >&2
  echo "  $0 -i" >&2
  echo "    Configure & enter interactive session. This Debian build" >&2
  echo "    environment starts you out here in the source directory" >&2
  echo "    ($PWD)" >&2
  echo "    and allows you to quickly rebuild by running ninja." >&2
  exit 1
fi

if $config_only; then
  if $opt_interactive; then
    echo "$0: -i has no effect with -feats (see $0 -h)" >&2
  fi
  docker run --rm -t -v "$PWD:/src" rsms/emsdk:latest \
    ./misc/config.js -write-if-changed ${config_args[@]}

elif $opt_interactive; then
  echo 'Tip: Type `ninja` to build; `./misc/config.js -h` for configuration.'
  docker run --rm -it -v "$PWD:/src" rsms/emsdk:latest \
    /bin/bash -ic "./misc/config.js -write-if-changed ${config_args[@]} && cat misc/interactive-rc >> ~/.bashrc && /bin/bash -i"

else
  docker run --rm -t -v "$PWD:/src" rsms/emsdk:latest \
    /bin/bash -c "./misc/config.js -write-if-changed ${config_args[@]} && ninja"
fi
