#!/bin/bash
set -e
cd "$(dirname "$0")/../src"

# See https://github.com/harfbuzz/harfbuzz/releases/latest
HB_VERSION=2.2.0

mkdir -p harfbuzz-tmp
pushd harfbuzz-tmp >/dev/null

if [[ ! -d harfbuzz-$HB_VERSION ]]; then
  TARFILE=harfbuzz-$HB_VERSION.tar.bz2
  if [[ ! -f "$TARFILE" ]]; then
    URL=https://github.com/harfbuzz/harfbuzz/releases/download/$HB_VERSION/$TARFILE
    echo "Fetching $URL"
    curl -LO "$URL"
  fi
  echo "Extracting $TARFILE"
  tar xzf $TARFILE
fi

pushd harfbuzz-$HB_VERSION >/dev/null
# ./configure && make

if [[ ! -d ../../harfbuzz/src-prev ]]; then
  echo "Making backup of src/harfbuzz/src into src/harfbuzz/src-prev"
  mv -f ../../harfbuzz/src ../../harfbuzz/src-prev
fi

mkdir -p ../../harfbuzz/src/hb-ucdn

cp -af src/*.cc ../../harfbuzz/src/
cp -af src/*.h ../../harfbuzz/src/
cp -af src/*.hh ../../harfbuzz/src/

cp -af src/hb-ucdn/*.c \
       src/hb-ucdn/*.h \
       src/hb-ucdn/README \
       src/hb-ucdn/COPYING \
       ../../harfbuzz/src/hb-ucdn/

cp -af README \
       COPYING \
       AUTHORS \
       ../../harfbuzz/

rm ../../harfbuzz/src/test* \
   ../../harfbuzz/src/dump* \
   ../../harfbuzz/src/hb-directwrite.* \
   ../../harfbuzz/src/hb-coretext.* \
   ../../harfbuzz/src/hb-graphite2.* \
   ../../harfbuzz/src/hb-uniscribe.* \
   ../../harfbuzz/src/hb-glib.* ../../harfbuzz/src/hb-gobject* \
   ../../harfbuzz/src/hb-icu.* \
   ../../harfbuzz/src/main.cc

rm -rf ../../build/obj
../../build.sh

popd >/dev/null
popd >/dev/null

echo "If everything works after building,"
echo "you can now remove the old source folder and temporary build folder:"
echo "rm -rf '$PWD/harfbuzz/src-prev'"
echo "rm -rf '$PWD/harfbuzz-tmp'"
