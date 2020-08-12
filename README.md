# KVH SARS-CoV-2 test results

## Setup

1. Download the [latest release][1] (the `.jar` file) of **tabula-java**
2. Rename it to `tabula.jar`. (Otherwise, the script will not be able to find it.)

## Manual run

In order to generate the large all-in-one CSV file, follow these steps.

1. Download the PDF files: `node download-pdf-files`
2. Convert the PDF files into one single CSV file: `./convert-and-combine-all-pdf-files.sh`

You can now browse _all_ test results from `all.csv`. Get well soon!

[1]: https://github.com/tabulapdf/tabula-java/releases/latest