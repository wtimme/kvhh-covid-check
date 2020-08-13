#!/bin/bash

# A bash script that converts all PDF documents into one single large CSV.

# Use an absolute path for directories so that the script can be invoked from anywhere.
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

# CONFIGURATION
TABULA_JAR="$parent_path/tabula.jar"
MAXIMUM_NUMBER_OF_PAGES=25
PDF_DIRECTORY="$parent_path/pdf"
CSV_DIRECTORY="$parent_path/csv"
TEMPORARY_PAGE_DIRECTORY="$parent_path/pages"
OUTPUT_FILE="$parent_path/all.csv"

# Converts the SARS-CoV-2 result PDF into CSV
function convert_pdf_file_to_csv() {
  # Parameters
  PDF_FILE=$1

  # Calculate the output filename
  filename_with_extension=$(basename $PDF_FILE)
  filename_without_extension=${filename_with_extension//.pdf/}
  csv_filename="$CSV_DIRECTORY/$filename_without_extension.csv"

  # Remove the old output files.
  rm -rf $csv_filename
  rm -f errors.txt

  # Remove directory in which the single pages were temporarily saved.
  rm -rf $TEMPORARY_PAGE_DIRECTORY

  # Make sure the output directories exists.
  mkdir -p $CSV_DIRECTORY
  mkdir -p $TEMPORARY_PAGE_DIRECTORY

  echo "Starting to convert $PDF_FILE..."

  # Iterate over all pages, from start to end.
  number_of_pages=0
  for ((page=1;page<=$MAXIMUM_NUMBER_OF_PAGES;page++)); do
    echo "Attempting to convert page $page..."

    filename="$TEMPORARY_PAGE_DIRECTORY/$page.csv"

    if [ $page -eq 1 ]; then
      # Use a smaller area for the first page, since it contains a title.
      java -jar $TABULA_JAR --pages $page --area 90,0,1420,700 $PDF_FILE > $filename 2>/dev/null
    else
      # Convert the rest of the pages. The `area` is different, since these pages do not contain a title.
      # The number of the last page (100) is just a value to make sure that *all* remaining pages are converted.
      java -jar $TABULA_JAR --pages $page --area 20,0,1420,700 $PDF_FILE > $filename 2>/dev/null
    fi

    tabula_exit_code=$?
    if [[ "$tabula_exit_code" -eq 1 ]] ; then
      echo "Reached the end of the document."

      # Remove the empty file from that last page, since it will be empty.
      rm $filename

      # Stop the conversion.
      break
    else
      number_of_pages=$page
    fi
  done

  echo "Converted $number_of_pages pages."

  # Combine all pages into one single document.
  echo "Combining all pages into one CSV..."
  for ((page=1;page<=$number_of_pages;page++)); do
    cat $TEMPORARY_PAGE_DIRECTORY/$page.csv >> $csv_filename
  done

  # Remove the first line, since it is the header of the table.
  tail -n +2 "$csv_filename" > "$csv_filename.tmp" && mv "$csv_filename.tmp" "$csv_filename"

  # Add the PDF filename to each line.
  ex +"%s/$/,$filename_with_extension/g" -cwq $csv_filename

  # Clean up by removing the single pages.
  echo "Cleaning up..."
  rm -rf $TEMPORARY_PAGE_DIRECTORY

  echo "Done."
}

# Converts and combines all PDF files into one single CSV file
function convert_and_combine_all_files() {
  # Remove the old CSV files.
  rm -rf "$CSV_DIRECTORY"

  # Process all files
  for filename in $PDF_DIRECTORY/*
  do
    convert_pdf_file_to_csv "$filename"
  done

  # Make sure any old data is removed.
  rm -f $OUTPUT_FILE

  echo "Combining all CSV files into one..."
  cat $CSV_DIRECTORY/* >> $OUTPUT_FILE

  echo "Adding column title..."
  echo "Code,Result,Date,Filename"|cat - $OUTPUT_FILE > /tmp/out && mv /tmp/out $OUTPUT_FILE

  echo "Asking the web server to reload the CSV data..."
  curl -s -o /dev/null -v http://localhost:1025/reload > /dev/null 2>&1 &

  echo "Done."
}

convert_and_combine_all_files