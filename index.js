// DEPENDENCIES
const express = require("express")

// CONFIGURATION
const port = 1025

// Set up Express
const app = express()

// Use Pug for rendering
app.set('view engine', 'pug')

// Make Bootstrap CSS and JavaScript available
app.use(express.static('node_modules/bootstrap/dist'))
app.use('/js', express.static('node_modules/@popperjs/core/dist/umd'))
app.use('/js', express.static('node_modules/jquery/dist'))

app.get('/', function (req, res) {
  res.render('index', { title: 'Hey', message: 'Hello there!' })
})

app.listen(port, () => {
  console.log(`Covid test result app listening at http://localhost:${port}`)
})