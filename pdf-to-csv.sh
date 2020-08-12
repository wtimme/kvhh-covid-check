#!/bin/bash

# A bash script that converts the SARS-CoV-2 result PDF into CSV

# PARAMETERS
PDF_FILE=$1
OUTPUT_FILE=${PDF_FILE/pdf/csv}

# CONFIGURATION
TABULA_JAR="tabula-1.0.3-jar-with-dependencies.jar"
TEMPORARY_PAGE_DIRECTORY="pages"
MAXIMUM_NUMBER_OF_PAGES=25

# Remove the old output files.
rm -rf $OUTPUT_FILE
rm -f errors.txt

# Remove directory in which the single pages were temporarily saved.
rm -rf $TEMPORARY_PAGE_DIRECTORY

# Make sure the temporary page directory exists.
mkdir -p $TEMPORARY_PAGE_DIRECTORY

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

# Clean up by removing the single pages.
echo "Cleaning up..."
rm -rf $TEMPORARY_PAGE_DIRECTORY

echo "Done."