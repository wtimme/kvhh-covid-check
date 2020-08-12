const rp = require('request-promise')
const $ = require('cheerio')
const https = require('https');
const fs = require('fs');
const path = require("path");

const base_url = 'https://www.kvhh.net'
const url = base_url + '/kvhh/pages/index/p/1424'
const pdf_directory = 'pdf'

// Make sure the target directory exists.
if (!fs.existsSync(pdf_directory)){
    fs.mkdirSync(pdf_directory);
}

rp(url)
  .then(function(html){
    const pdf_urls = new Set()

    const link_tags = $('.table-doc-list a', html)

    for (let i = 0; i < link_tags.length; i++) {
      const url = link_tags[i].attribs.href
      const absolute_url = base_url + url

      pdf_urls.add(absolute_url)
      downloadFile(absolute_url)
    }

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