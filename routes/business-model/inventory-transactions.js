
var _ = require('underscore')
var Filter = require('airtable-filter')

var express = require('express')
var router = express.Router()

var airtablePromise = require('../../utils/airtable-promise')

var base = require('../../index').base
var Shipments = base(base.tables['Shipments'])
var ShipmentLineItems = base(base.tables['Shipment Line Items'])
var InventoryTransactions = base(base.tables['Inventory Transactions'])

module.exports = router








