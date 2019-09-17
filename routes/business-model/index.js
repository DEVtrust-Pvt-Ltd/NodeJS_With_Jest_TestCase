
var express = require('express')
var router = express.Router()

var shipments = require('./shipments')
var materials = require('./materials')

router.use('/inventory-transactions', require('./inventory-transactions'))

router.get('/materials/sync.ascii', materials.sync)

router.post('/shipments.json', shipments.create)
router.post('/shipments/:shipmentId/receive.json', shipments.receive)

module.exports = router
