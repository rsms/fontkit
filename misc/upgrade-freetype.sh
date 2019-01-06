#!/bin/bash
set -e
cd "$(dirname "$0")/../src"

# See https://download.savannah.gnu.org/releases/freetype/
FT_VERSION=2.9.1

mkdir -p freetype-tmp
pushd freetype-tmp >/dev/null

if [[ ! -d freetype-$FT_VERSION ]]; then
  TARFILE=freetype-$FT_VERSION.tar.gz
  if [[ ! -f "$TARFILE" ]]; then
    URL=https://download.savannah.gnu.org/releases/freetype/$TARFILE
    echo "Fetching $URL"
    curl -LO "$URL"
  fi
  echo "Extracting $TARFILE"
  tar xzf $TARFILE
fi

popd >/dev/null

FTSRC=freetype-tmp/freetype-$FT_VERSION

if [[ ! -d freetype-prev ]]; then
  echo "Making backup of $PWD/$FTSRC into $PWD/freetype-prev"
  mv -f "$FTSRC" freetype-prev
else
  rm -rf freetype
fi
mkdir -p freetype
cp -a freetype-prev/ftmodule.h freetype/ftmodule.h

cp -af  $FTSRC/docs/FTL.TXT  freetype/
cp -af  $FTSRC/src           freetype/src
cp -af  $FTSRC/include       freetype/include

rm -rf freetype/src/tools

find freetype -type f -name Jamfile -exec rm '{}' ';' &
find freetype -type f -name README -exec rm '{}' ';' &
find freetype -type f -name '*.mk' -exec rm '{}' ';' &

mv freetype/include/freetype/config/ftmodule.h \
   freetype/include/freetype/config/ftmodule-orig.h
ln -s ../../../ftmodule.h  freetype/include/freetype/config/ftmodule.h

wait

# show diff
echo "Difference of src/base:"
echo "------------------------------------------------"
diff --brief -r freetype/src/base freetype-prev/src/base | \
  grep -v ' differ' | grep -v '.DS_Store'
echo "------------------------------------------------"
echo "Difference of freetype (excluding src/base):"
diff --brief -r freetype freetype-prev | \
  grep -v '/src/base:' | grep -v ' differ' | grep -v '.DS_Store'
echo "------------------------------------------------"
echo "When ftSourceFiles in misc/config.js has been updated, build:"
echo ""
echo "  rm -rf build/obj && ./build.sh"
echo ""


# popd >/dev/null
# popd >/dev/null
# pushd .. >/dev/null

# echo "$PWD/build.sh"
# rm -rf build/obj && ./build.sh


# echo "If everything works after building,"
# echo "you can now remove the old source folder and temporary build folder:"
# echo "rm -rf '$PWD/src/freetype-prev'"
# echo "rm -rf '$PWD/src/freetype-tmp'"
