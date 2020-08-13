// DEPENDENCIES
const express = require("express")
const csv = require('csv-parser')
const fs = require('fs')
const path = require('path');

// CONFIGURATION
const port = 1025
const csvFilename = 'all.csv'
const lastUpdatedFile = path.resolve(__dirname, 'last-updated.txt')

// Set up Express
const app = express()

// Use Pug for rendering
app.set('view engine', 'pug')

// Make Bootstrap CSS and JavaScript available
app.use(express.static('node_modules/bootstrap/dist'))
app.use('/js', express.static('node_modules/@popperjs/core/dist/umd'))
app.use('/js', express.static('node_modules/jquery/dist'))

app.get('/', function (req, res) {
  var templateVariables = {
    'lastUpdated': lastUpdatedDate
  }

  res.render('index', templateVariables)
})

app.get('/suche', function (req, res) {
  const code = req.query.code.trim()

  if (code.length == 0) {
    res.redirect('/')
    return
  }

  const rows = csvRows.filter(function(row) {
    return row['Code'].toLowerCase().includes(code.toLowerCase())
  })

  res.render('search-results', {
    'lastUpdated': lastUpdatedDate,
    code: code,
    rows: rows,
  })
})

app.get('/reload', function (req, res) {
  reloadCSVData(function() {
    res.send('CSV data reloaded.')
  })
});

app.get('/alle-daten', function (req, res) {
  res.render('all-data', {
    rows: csvRows,
    lastUpdated: lastUpdatedDate,
    activeModule: 'all-data',
  })
});

// Current CSV data
var csvRows = [];
var lastUpdatedDate;

var reloadCSVData = function() {
  const parsedRows = []

  fs.createReadStream(csvFilename)
    .pipe(csv())
    .on('data', (data) => parsedRows.push(data))
    .on('end', () => {
      csvRows = parsedRows

      // Read the 'last updated' date
      lastUpdatedDate = fs.readFileSync(lastUpdatedFile, { encoding: 'utf8', flag: 'r' }); 

      console.log('CSV data reloaded successfully')
    });
};

app.listen(port, () => {
  reloadCSVData()

  console.log(`Covid test result app listening at http://localhost:${port}`)
})