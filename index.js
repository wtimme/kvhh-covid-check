// DEPENDENCIES
const express = require("express")

// CONFIGURATION
const port = 1025

// Set up Express
const app = express()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Covid test result app listening at http://localhost:${port}`)
})