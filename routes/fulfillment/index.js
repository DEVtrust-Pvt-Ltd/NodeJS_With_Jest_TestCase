
var AsciiTable = require('ascii-table')
var _ = require('underscore')
var json2csv = require('json2csv')
var countries = require('country-data').countries
var nocache = require('nocache')
var moment = require('moment')
var humanize = require('humanize-string')
var capitalize = require('capitalize')
var humanname = require('humanname')
var Filter = require('airtable-filter')
var Airtable = require('airtable')
var Estimator = require('./fulfillment-estimator')
var mapper = require('./material-mapper')

var shipstationHelper = require('./shipstation-helper')
var ShipStation = require('node-shipstation')

var express = require('express')
var router = express.Router()

router.get('/picklist.ascii', nocache(), function (req, res) {

	var tag = req.query.tag

	var materialQuantities = {}

	shipstationHelper.getOrders(req).then(function (orders) {

		var materialNames = []
		_.each(orders, function (order) {

			_.each(order.items, function (item) {

				_.each(item.fulfillmentMaterials, function (materialName) {

					if (materialQuantities[materialName] === undefined) {
						materialNames.push(materialName)
			        	materialQuantities[materialName] = 0
			        }

					materialQuantities[materialName]++ //this will be innacurate if a SKU contains multiples of the same material
				})
			})
		})

		materialNames = materialNames.sort()
		//in-house Pick List - 7/30/2017
		var table = new AsciiTable(capitalize.words(humanize(tag)) + ' Pick List - ' + moment().format('M/D/YYYY'))
		//console.log('tag: ' + humanize(tag))
	    table.setHeading('Picked', 'Checked Out', 'Quantity', 'Material')

	    _.each(materialNames, function (key) {
	    	table.addRow('[ ]', '[ ]', materialQuantities[key], key)
	    })

	    //console.log("table: " + table.toString())
	    res.send('<pre>' + table.toString() + '</pre>')

	}, function (error) {
		res.status(500).send('error: ' + JSON.stringify(error))
	})
})

router.get('/shyp/orders.csv', nocache(), function (req, res) {

	shipstationHelper.getOrders(req).then(function (mappedOrders) {

		var rows = []
		var maxSkuCount = 0
		_.each(mappedOrders, function (order) {

			var row = {
				'Full Name*': order.shipTo.name,
				'Company Name': order.shipTo.company,
				'Address Line 1*': order.shipTo.street1,
				'Address Line 2': order.shipTo.street2,
				'City*': order.shipTo.city,
				'State*': order.shipTo.state,
				'Zip Code*': order.shipTo.postalCode,
				'Country* (United States only)': countries[order.shipTo.country].name,
				'Share Tracking Email': 'jon@bikepretty.com',
				'Share Tracking Phone Number (10 digits)': undefined,
				'Packaging Required* [y/n]': 'y',
				'Country Code*': order.shipTo.country,
				'Custom-1 Order ID': order.orderNumber
			}

			var materials = []

			for (var i = 0; i < order.items.length; i++) {
				var item = order.items[i]
				materials = materials.concat(item.fulfillmentMaterials)
			}

			for (var i = 0; i < materials.length; i++) {

				var material = materials[i]

				var skuCount = i + 1
				row['Custom-' + (i + 2) + ' SKU ' + skuCount] = material

				if (skuCount > maxSkuCount) {
					maxSkuCount = skuCount
				}
			}

			rows.push(row)
		})

		var fields = ['Full Name*',
				'Company Name',
				'Address Line 1*',
				'Address Line 2',
				'City*',
				'State*',
				'Zip Code*',
				'Country* (United States only)',
				'Share Tracking Email',
				'Share Tracking Phone Number (10 digits)',
				'Packaging Required* [y/n]',
				'Country Code*',
				'Custom-1 Order ID']

		for (var i = 0; i < maxSkuCount; i++) {
			fields.push('Custom-' + (i + 2) + ' SKU ' + (i + 1))
		}

		res.send(json2csv({data: rows, fields: fields}))

	}, function (error) {
		res.status(500).send('error: ' + JSON.stringify(error))
	})
})

router.post('/estimate.json', function (req, res) {

	var rate = req.body.rate
	const method = req.body.method

	if (!rate) {
		return res.status(500).send('rate is a required parameter')
	}

	mapper.addMaterialsToOrder(rate).then(function (mapped) {

		var estimator = new Estimator()
		return estimator.estimate({
			order: mapped,
			method
		})

	}).then(function (estimates) {

		var formattedEstimates = []
		_.each(estimates, function (estimate) {

			var priorityLevel = estimate.strategy.get('Fulfillment Priority Level')[0]

			formattedEstimates.push({
				service_name: priorityLevel.get('Name'),
				description: priorityLevel.get('Description'),
				service_code: priorityLevel.get('Code'),
				currency: 'USD',
				total_price: estimate.totalPrice
			})
		})

		res.send({
			rates: formattedEstimates,
			estimates
		})

	}).catch(function (e) {

		if (e.stack) {
			console.log('e: ' + e.stack)
		}
		else {
			console.log(JSON.stringify(e))
		}

		res.status(500).send(e)
	})
})

router.get('/map/:sku', async function (req, res) {

	const sku = req.params.sku

	let mapped
	try {
		mapped = await mapper.addMaterialsToItem({ sku })
	}
	catch (error) {
		return res.status(500).send(`error mapping sku: ${error.message}`)
	}
	
	res.send({
		mapped: {
			sku: mapped.sku,
			materials: mapped.fulfillmentMaterials
		}
	 })
})

const PENDING_FULFILLMENT_TAG = 56501
const DROP_SHIP_TAG = 54949
const INHOUSE_TAG = 54220
const EFS_TAG = 56330

var TradeGecko = require('./trade-gecko')
var tradeGecko = new TradeGecko({
	apiToken: '6b9e025a6bc6bb48330ee911e007a5a98d67676fcf33fed21498e509d1b04d94'
})

router.post('/assign/:shipstationId', async function (req, res) {

	const shipstationId = req.params.shipstationId
	
	//load the order from shipstation
	const order = await shipstationHelper.getOrder(shipstationId)

	//validate address
	if (order.shipTo.addressVerified != 'Address validated successfully') {
		throw new Error('Invalid address cannot be assigned')
	}

	//validate fulfillment status (no pending-fulfillment tag)
	//validate assignment tags (no efs, in-house, or dropship)
	const tags = order.tagIds
	const disallowedTags = [PENDING_FULFILLMENT_TAG, DROP_SHIP_TAG, INHOUSE_TAG, EFS_TAG]
	const overlapArray = tags.filter(value => disallowedTags.includes(value))
	if (overlapArray.length > 0) {
		throw new Error('Order has already been assigned or is already pending fulfillment')
	}

	//load the skus from trade-gecko.loadVariant
	const skus = order.items.map(async item => {
		return await mapper.addMaterialsToItem(item)
	})

	//query airtable for EFS skus (where SKU is equal to tradegecko sku.fulfillmentsku.barcode)
	//determine if all skus can be shipped by EFS (result of query.length == number of fulfillment materials)
	//add fulfillment provider tag to order in shipstation (EFS_TAG)
	//shipstationHelper.updateOrder() needs to be implemented
	//send response
	res.send({
		assigned: [{
			orderId: 'test',
			shipstationId: shipstationId,
			assignedTo: 'efs'
		}]
	})
})

module.exports = router





