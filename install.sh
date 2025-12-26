#!/bin/bash

echo "Installing ES9018K2M i2c Control Plugin"


PLUGIN_DIR="$(dirname "$0")"
cd "$PLUGIN_DIR"


echo "Installing npm dependencies..."
npm install


echo "plugininstallend"
