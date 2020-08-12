// DEPENDENCIES
const express = require("express")
const csv = require('csv-parser')
const fs = require('fs')

// CONFIGURATION
const port = 1025
const csvFilename = 'all.csv'

// Set up Express
const app = express()

// Use Pug for rendering
app.set('view engine', 'pug')

// Make Bootstrap CSS and JavaScript available
app.use(express.static('node_modules/bootstrap/dist'))
app.use('/js', express.static('node_modules/@popperjs/core/dist/umd'))
app.use('/js', express.static('node_modules/jquery/dist'))

app.get('/', function (req, res) {
  var rowWithCode;
  if (req.query.code && req.query.code.length > 0) {
    const code = req.query.code.trim()
    rowWithCode = csvRows.find(function(row) {
      return row['Code'] === code
    })

    if (!rowWithCode) {
      res.render('no-result')
    } else if (rowWithCode['Result'] == 'negativ') {
      res.render('result-negative', { row: rowWithCode })
    } else if (rowWithCode['Result'] == 'positiv') {
      res.render('result-positive', { row: rowWithCode })
    } else {
      res.render('result-unknown', { row: rowWithCode })
    }
  } else {
    res.render('index')
  }
})

// Current CSV data
var csvRows = [];

var reloadCSVData = function() {
  const parsedRows = []

  fs.createReadStream(csvFilename)
    .pipe(csv())
    .on('data', (data) => parsedRows.push(data))
    .on('end', () => {
      csvRows = parsedRows

      console.log('CSV data reloaded successfully')
    });
};

app.listen(port, () => {
  reloadCSVData()

  console.log(`Covid test result app listening at http://localhost:${port}`)
})