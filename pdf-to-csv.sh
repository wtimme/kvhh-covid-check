#!/bin/bash

# CONFIGURATION
TABULA_JAR="tabula.jar"
CSV_OUTPUT_DIRECTORY="csv"
TEMPORARY_PAGE_DIRECTORY="pages"
MAXIMUM_NUMBER_OF_PAGES=25

# Converts the SARS-CoV-2 result PDF into CSV
function convert_pdf_file_to_csv() {
  # Parameters
  PDF_FILE=$1

  # Calculate the output filename
  filename_with_extension=$(basename $PDF_FILE)
  filename_without_extension=${filename_with_extension//.pdf/}
  OUTPUT_FILE="$CSV_OUTPUT_DIRECTORY/$filename_without_extension.csv"

  # Remove the old output files.
  rm -rf $OUTPUT_FILE
  rm -f errors.txt

  # Remove directory in which the single pages were temporarily saved.
  rm -rf $TEMPORARY_PAGE_DIRECTORY

  # Make sure the output directories exists.
  mkdir -p $CSV_OUTPUT_DIRECTORY
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
    cat $TEMPORARY_PAGE_DIRECTORY/$page.csv >> $OUTPUT_FILE
  done

  # Remove the first line, since it is the header of the table.
  tail -n +2 "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp" && mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"

  # Clean up by removing the single pages.
  echo "Cleaning up..."
  rm -rf $TEMPORARY_PAGE_DIRECTORY

  echo "Done."
}

 convert_pdf_file_to_csv $1