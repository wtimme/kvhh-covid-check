#!/bin/bash

# A bash script that converts all PDF documents into one single large CSV.

# CONFIGURATION
PDF_DIRECTORY="./pdf"
CSV_DIRECTORY="./csv"
OUTPUT_FILE="all.csv"

# Remove the old output files.
rm -f $OUTPUT_FILE
rm -rf "$CSV_DIRECTORY"

# Process all files
for filename in $PDF_DIRECTORY/*
do
  bash pdf-to-csv.sh "$filename"
done

echo "Combining all CSV files into one..."
cat $CSV_DIRECTORY/* >> $OUTPUT_FILE

echo "Adding column title..."
echo "Code,Result,Date"|cat - $OUTPUT_FILE > /tmp/out && mv /tmp/out $OUTPUT_FILE

echo "Asking the web server to reload the CSV data..."
curl -s -o /dev/null -v http://localhost:1025/reload

echo "Done."