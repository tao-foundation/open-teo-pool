#!/usr/bin/env bash

TEO_ARCHIVE_NAME="teo-pool-$TRAVIS_OS_NAME-$TRAVIS_TAG"
zip -j "$TEO_ARCHIVE_NAME.zip" build/bin/open-teo-pool
