const rp = require('request-promise')
const needle = require('needle')
const $ = require('cheerio')
const https = require('https');
const fs = require('fs');
const path = require("path");

const base_url = 'https://www.laborergebnisse-hamburg.de'
const pdf_directory = path.resolve(__dirname, 'pdf')
const last_updated_file = path.resolve(__dirname, 'last-updated.txt')

// Make sure the target directory is clean and exists.
fs.rmdirSync(pdf_directory, { recursive: true });
fs.mkdirSync(pdf_directory, { recursive: true });

// Gets the URLs for all the testing sites in Hamburg.
// The lists with the PDFs are available under these URLs.
getTestingSiteURLs = function() {
  return new Promise(function(resolve, reject) {
    needle(base_url, function(error, response) {
      if (error) {
        console.error('Failed to retrieve testing sites.')

        return reject(error)
      }

      const navigationLinks = $('[data-container="navigation"] li a', response.body)
      const testingSiteURLs = new Set()
      navigationLinks.each(function(i, element) {
        const relativeURL = element.attribs.href
        
        if (relativeURL == '/') {
          // We are not interested in links to the homepage.
          return
        }

        const absoluteURL = `${base_url}${relativeURL}`
        testingSiteURLs.add(absoluteURL)
      })

      resolve(Array.from(testingSiteURLs))
    })
  })
}

// Fetches the URLs to all PDF downloads for a particular testing site.
// The `testingSiteURL` page contains a list of PDF download links.
getPDFURLsFromTestingSiteURL = function(testingSiteURL) {
  return new Promise(function(resolve, reject) {
    needle(testingSiteURL, function(error, response) {
      if (error) {
        console.error(`Failed to retrieve PDFs from ${testingSiteURL}`)

        return reject(error)
      }

      const downloadLinks = $('.cc-m-download-file-link .cc-m-download-link', response.body)
      const pdfURLs = new Set()
      downloadLinks.each(function(i, element) {
        const relativeURL = element.attribs.href
        const absoluteURL = `${base_url}${relativeURL}`

        pdfURLs.add(absoluteURL)
      })

      resolve(Array.from(pdfURLs))
    })
  })
}

rp(url)
.then(function(html){
  const pdf_urls = new Set()

  // Check when the data was last updated (according to their website)
  last_updated_date = $('.table-doc-list h6 strong', html).text()
  if (last_updated_date.length > 0) {
    console.log('Last updated (according to them):', last_updated_date)

    fs.writeFileSync(last_updated_file, last_updated_date, "UTF-8", {'flags': 'w'})
  }
  
  const link_tags = $('.table-doc-list a', html)
  
  for (let i = 0; i < link_tags.length; i++) {
    const url = link_tags[i].attribs.href
    const absolute_url = base_url + url
    
    pdf_urls.add(absolute_url)
    downloadFile(absolute_url)
  }
  
  console.log('Downloaded', link_tags.length, 'files:');
  console.log(pdf_urls)
})
.catch(function(err){
  console.error('Failed to get HTML:', err)
});

var downloadFile = function(url, cb) {
  var filename = path.basename(url)
  var destination_path = pdf_directory + '/' + filename
  
  var file = fs.createWriteStream(destination_path);
  var request = https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
}