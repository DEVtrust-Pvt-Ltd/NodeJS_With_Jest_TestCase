
var express = require('express')
var bodyParser = require('body-parser')

//configure airtable
var Airtable = require('airtable')
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: process.env.AIRTABLE_API_KEY
})

var base = Airtable.base(process.env.AIRTABLE_BASE)
base.tables = require('./schema')[process.env.AIRTABLE_BASE].tables
module.exports.base = base

//setup routes
var app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')

app.use('/fulfillment', require('./routes/fulfillment'))
app.use('/business-model', require('./routes/business-model'))
app.use('/templates', require('./routes/templates'))
app.use(express.static('public'))

//start the server
var port = process.env.PORT || 8888
var server = require('http').createServer(app)
server.listen(port, function () {
  console.log('Express server listening on %d', port)
})

//public API
module.exports.server = server
