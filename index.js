// DEPENDENCIES
const express = require("express")
const csv = require('csv-parser')
const fs = require('fs')
const path = require('path');
const moment = require('moment')

// CONFIGURATION
const port = 1025
const csvFilename = path.resolve(__dirname, 'all.csv')
const lastUpdatedFile = path.resolve(__dirname, 'last-updated.txt')
const pageTitle = 'Corona Abstrichtest'

// Set up Express
const app = express()

// Use Pug for rendering
app.set('view engine', 'pug')

// Make Bootstrap CSS and JavaScript available
app.use(express.static('node_modules/bootstrap/dist'))
app.use('/js', express.static('node_modules/@popperjs/core/dist/umd'))
app.use('/js', express.static('node_modules/jquery/dist'))

// Determines the common template variables that are provided for each route.
var getTemplateVariables = function (variables = {}) {
  const commonVariables = {
    'lastUpdated': lastUpdatedDate,
    lastModifiedAbsolute: absoluteModifiedDate,
    lastModifiedRelative: moment(absoluteModifiedDate).locale('de').fromNow(),
    title: variables.title ? pageTitle + ': ' + variables.title : pageTitle,
  }

  return Object.assign({}, variables, commonVariables)
}

app.get('/', function (req, res) {
  res.render('index', getTemplateVariables())
})

app.get('/suche', function (req, res) {
  const regularExpression = /([^\/]+)/i
  const match = regularExpression.exec(req.query.code)
  const code = match ? match[1] : ""

  if (code.length == 0) {
    res.redirect('/')
    return
  }

  const rows = csvRows.filter(function(row) {
    return row['Code'].toLowerCase().includes(code.toLowerCase())
  })

  res.render('search-results', getTemplateVariables({
    code: code,
    rows: rows,
    title: 'Suchergebnisse',
  }))
})

app.get('/reload', function (req, res) {
  reloadCSVData()
  res.redirect('/?reloaded')
});

app.get('/alle-daten', function (req, res) {
  res.render('all-data', getTemplateVariables({
    rows: csvRows,
    activeModule: 'all-data',
    title: 'Alle Daten',
  }))
});

app.get('/hintergrund', function (req, res) {
  res.render('about', getTemplateVariables({
    activeModule: 'about',
    title: 'Hintergrund',
  }))
});

// Current CSV data
var csvRows = [];
var lastUpdatedDate;
var absoluteModifiedDate;

var reloadCSVData = function() {
  const parsedRows = []

  fs.createReadStream(csvFilename)
    .pipe(csv())
    .on('data', (data) => parsedRows.push(data))
    .on('end', () => {
      csvRows = parsedRows

      // Read the 'last updated' date
      lastUpdatedDate = fs.readFileSync(lastUpdatedFile, { encoding: 'utf8', flag: 'r' }); 

      // Check when the CSV file was last modified, since this is the date at which the Cronjob last run.
      var stats = fs.statSync(csvFilename)
      absoluteModifiedDate = stats.mtime
      console.log('Data was last updated at', absoluteModifiedDate)

      console.log('CSV data reloaded successfully')
    });
};

app.listen(port, () => {
  reloadCSVData()

  console.log(`Covid test result app listening at http://localhost:${port}`)
})