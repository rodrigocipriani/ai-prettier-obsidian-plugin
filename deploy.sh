#!/bin/bash

# Load environment variables from .env file
source .env

# Check if OBSIDIAN_FOLDER is set
if [ -z "$OBSIDIAN_FOLDER" ]; then
  echo "OBSIDIAN_FOLDER is not set in the .env file."
  exit 1
fi

# Define the target plugin folder
PLUGIN_FOLDER="$OBSIDIAN_FOLDER/.obsidian/plugins/ai-prettier-obsidian-plugin"

# Create dist directory if it doesn't exist
mkdir -p dist

# Build the plugin
echo "Building the plugin..."
npm run build

# Check if the build was successful
if [ $? -ne 0 ]; then
  echo "Build failed."
  exit 1
fi

# Create the plugin folder if it doesn't exist
mkdir -p "$PLUGIN_FOLDER"

# Copy files to the plugin folder
echo "Copying files to the plugin folder..."
cp dist/main.js manifest.json "$PLUGIN_FOLDER"

# Check if the copy was successful
if [ $? -ne 0 ]; then
  echo "Failed to copy files to the plugin folder."
  exit 1
fi

echo "Deployment successful!"