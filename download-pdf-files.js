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

// Gets the PDF URLs for *all* testing sites.
getAllPDFURLs = function() {
  return new Promise(function(resolve, reject) {
    getTestingSiteURLs()
      .then((testingSiteURLs) => {
        const promises = testingSiteURLs.map((url) => {
          return getPDFURLsFromTestingSiteURL(url)
        })
        
        Promise.all(promises)
          .then((results) => {
            var allURLs = []

            for (i = 0; i < results.length; i++) {
              allURLs = allURLs.concat(results[i])
            }

            resolve(allURLs)
          })
      })
      .catch(reject)
  })
}

// Downloads the PDF from the given URL.
// Follows a redirect, if there was one.
downloadPDF = function(url) {
  return new Promise(function(resolve, reject) {
    var filenameEncoded = path.basename(url).split('?')[0]
    var filename = decodeURIComponent(filenameEncoded)
    var destination_path = `${pdf_directory}/${filename}`
  
    var file = fs.createWriteStream(destination_path);
    const requestOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:79.0) Gecko/20100101 Firefox/79.0'
      }
    }
    var request = https.get(url, requestOptions, function(res) {
      if (res.statusCode === 302) {
        // This is a redirect.
        file.close(() => {
          // Close and remove the file.
          fs.unlink(destination_path, function() {
            const redirectURL = res.headers.location
            downloadPDF(redirectURL).then(resolve).catch(reject)
          })
        })
        return
      }
      
      res.pipe(file);

      file.on('finish', function() {
        file.close(resolve);  // close() is async, call cb after close completes.
      });
    }).on('error', function(err) {
      console.error('Download failed.')

      // Delete the file async.
      fs.unlink(destination_path);

      reject(err)
    });
  })
}

getAllPDFURLs()
  .then((urls) => {
    console.log(`Starting to download ${urls.length} PDFs...`)
    
    const promises = urls.map((url) => {
      return downloadPDF(url)
    })
    
    Promise.all(promises)
      .then((results) => {
        console.log('Downloads completed.')
      })
      .catch((err) => {
        console.error('An error occurred.', err)
      })
  })
  .catch((err) => {
    console.error("Failed to download all PDFs.")
  })