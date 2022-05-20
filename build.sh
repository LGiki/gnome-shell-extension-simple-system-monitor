#!/bin/bash

enable_code_format=1

if ! command -v npm &> /dev/null
then
    echo "npm could not be found, skip code format"
    enable_code_format=0
fi

if [ $enable_code_format -eq 1 ]
then
    if [ ! -d 'node_modules/prettier' ]; then
        echo "Prettier not installed, install it first"
        npm install
    fi
    echo "Start formatting code..."
    npm run format
    echo "End formatting code."
fi

echo "Start packing..."
gnome-extensions pack src \
    --extra-source="settings.js" \
    --extra-source="prefs.ui" \
    --extra-source="prefs_gtk3.ui" \
    --force
echo "Done."
