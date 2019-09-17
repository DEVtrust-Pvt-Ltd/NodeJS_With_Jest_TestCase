
var _ = require('underscore')
var Filter = require('airtable-filter')
var moment = require('moment')

var airtablePromise = require('../../utils/airtable-promise')
var base = require('../../index').base
var Shipments = base(base.tables['Shipments'])
var ShipmentLineItems = base(base.tables['Shipment Line Items'])
var InventoryTransactions = base(base.tables['Inventory Transactions'])
var Materials = base(base.tables['Materials'])

function create(req, res) {

	var body = req.body

	var validWarehouses = ['Closet', 'Omni', 'Shyp Chicago', 'Vendor']
	var from = body.from
	if (!from) {
		return res.status(500).send('from is a required parameter')
	}
	else if (!validWarehouses.includes(from)) {
		return res.status(500).send(new Error(from + 'is not a valid from warehouse'))
	}

	var to = body.to
	if (!to) {
		return res.status(500).send('to is a required parameter')
	}
	else if (!validWarehouses.includes(to)) {
		return res.status(500).send(new Error(to + 'is not a valid to warehouse'))
	}

	var lineItems = body.lineItems
	if (!lineItems) {
		return res.status(500).send('lineItems is a required parameter')
	}

	var now = moment()

	var estimatedShipDate = body.estimatedShipDate
	if (!estimatedShipDate) {
		estimatedShipDate = now
	}
	else {

		estimatedShipDate = moment(estimatedShipDate)
		if (!estimatedShipDate.isValid()) {
			return res.status(500).send('estimatedShipDate is not a valid date: ' + estimatedShipDate)
		}
	}

	var estimatedArrivalDate = body.estimatedArrivalDate
	if (!estimatedArrivalDate) {
		estimatedArrivalDate = now
	}
	else {

		estimatedArrivalDate = moment(estimatedArrivalDate)
		if (!moment(estimatedArrivalDate).isValid()) {
			return res.status(500).send('estimatedArrivalDate is not a valid date: ' + estimatedArrivalDate)
		}
	}

	var requestedOn = body.requestedOn
	if (!requestedOn) {
		requestedOn = now
	}
	else {
		requestedOn = moment(requestedOn)
		if (!moment(requestedOn).isValid()) {
			return res.status(500).send('requestedOn is not a valid date: ' + requestedOn)
		}
	}

	if (estimatedShipDate.isBefore(requestedOn)) {
		return res.status(500).send('estimatedShipDate cannot be before requestedOn')
	}

	if (estimatedShipDate.isAfter(estimatedArrivalDate)) {
		return res.status(500).send('estimatedShipDate cannot be after estimatedArrivalDate')
	}

	var attachments = body.attachments

	if (typeof attachments == 'string') {
		attachments = [attachments]
	}

	if (attachments && attachments.constructor == Array && attachments.length > 0) {

		var urls = attachments
		attachments = []

		_.each(urls, function (url) {
			attachments.push({
				url: url
			})
		})
	}

	validateLineItems(lineItems).then(function (validatedLineItems) {

		var lineItems = validatedLineItems

		var shipmentFields = {
			"Closed": false,
			"Notes": body.notes,
			"Requested On": requestedOn.format(),
			"Estimated Ship Date": estimatedShipDate.format(),
			"Estimated Arrival Date": estimatedArrivalDate.format(),
			"Estimated Cost": body.estimatedCost,
			"To Warehouse": to,
			"From Warehouse": from,
			"Attachments": attachments,
		}

		var shipment
		return airtablePromise.create(shipmentFields, Shipments)

	}).then(function (newShipment) {

		shipment = newShipment

		var shipmentLineItems = []
		_.each(lineItems, function (lineItem) {

				shipmentLineItems.push({
					"Material": lineItem.material.id,
					"Quantity": lineItem.quantity,
					"Shipment": shipment.id
				})
		})

		return airtablePromise.createAll(shipmentLineItems, ShipmentLineItems)

	}).then(function (shipmentLineItems) {

		var filterShipments = new Filter(Shipments)
		filterShipments.id.isEqualTo(shipment.id)
		filterShipments.include('Shipment Line Items', ShipmentLineItems)
		return filterShipments.first()

	}).then(function (loadedShipment) {

		res.send({
			shipment: recordToObject(loadedShipment)
		})

	}, function (error) {
		res.status(500).send(error.stack)
	})
}

function receive(req, res) {

	var shipmentId = req.params.shipmentId

	var body = req.body

	var responseData = {}
	var shipment

	var promise = Promise.resolve()
	var lineItems = body.lineItems

	if (lineItems) {
		promise = validateLineItems(lineItems)
	}

	promise.then(function () {
		return airtablePromise.find(shipmentId, Shipments)

	}).then(function (fetchedShipment) {

		shipment = fetchedShipment

		if (shipment.get('Closed')) {
			return response.status(500).send(new Error('Cannot receive a shipment that is marked as closed'))
		}

		var shipmentLineItems = new Filter(ShipmentLineItems)
		shipmentLineItems.id.isContainedIn(shipment.get('Shipment Line Items'))
		return shipmentLineItems.all()

	}).then(function (lineItems) {

		var inventoryTransactionObjects = []
		var type = shipment.get('Type')
		if (type == 'Transfer') {

			_.each(lineItems, function (lineItem) {

				var inventoryTransactionObject = createInventoryTransaction({
					shipment: shipment,
					lineItemRecord: lineItem,
					warehouse: shipment.get('From Warehouse'),
					incoming: false,
					lineItemObject: findLineItemObject(lineItem, req.body.lineItems)
				})

				if (inventoryTransactionObject["Quantity"] != 0) {
					inventoryTransactionObjects.push(inventoryTransactionObject)
				}
			})
		}

		_.each(lineItems, function (lineItem) {

			var inventoryTransactionObject = createInventoryTransaction({
				shipment: shipment,
				lineItemRecord: lineItem,
				warehouse: shipment.get('To Warehouse'),
				incoming: true,
				lineItemObject: findLineItemObject(lineItem, req.body.lineItems)
			})

			if (inventoryTransactionObject["Quantity"] != 0) {
				inventoryTransactionObjects.push(inventoryTransactionObject)
			}
		})

		return airtablePromise.createAll(inventoryTransactionObjects, InventoryTransactions)

	}).then(function (records) {

		var transactions = []
		_.each(records, function (record) {
			transactions.push(recordToObject(record))
		})

		responseData.inventoryTransactions = transactions
		return airtablePromise.find(shipment.id, Shipments)

	}).then(function (loadedShipment) {

		var closed = body.closed
		if (closed === undefined && loadedShipment.get('Progress') == 100) {
			closed = true
		}
		
		if (closed !== undefined) {
			return airtablePromise.update(loadedShipment.id, {
				"Closed": closed
			}, Shipments)
		}
		
		return loadedShipment

	}).then(function (shipment) {
		responseData.shipment = recordToObject(shipment)
		res.send(responseData)

	}, function (error) {
		res.status(500).send(error.stack)
	})
}

function findLineItemObject(lineItemRecord, lineItems) {

	if (lineItems) {
		for(var i = 0; i < lineItems.length; i++) {
			var lineItem = lineItems[i]
			if (lineItem.material.id == lineItemRecord.get('Material')[0]) {
				return lineItem
			}
		}
	}

	return null
}

function validateLineItems(lineItems) {

	var lineItems = sanitizeLineItems(lineItems)

	var lineItemNames = []
	_.each(lineItems, function (lineItem) {
		lineItemNames.push(lineItem.material)
	})

	var materialsFilter = new Filter(Materials)
	materialsFilter.where('Name').isContainedIn(lineItemNames)
	return materialsFilter.each(function (material) {

		var name = material.get('Name')

		_.each(lineItems, function (lineItem) {
			if (typeof lineItem.material == 'string' && lineItem.material == name) {
				lineItem.material = material
			}
		})

	}).then(function () {

		for (var i = 0; i < lineItems.length; i++) {

			var lineItem = lineItems[i]
			if (typeof lineItem.material == 'string') {
				throw new Error('material named ' + lineItem.material + ' was not found.')
				return
			}
		}

		return Promise.resolve(lineItems)
	})
}

function createInventoryTransaction(params) {

	var shipment = params.shipment
	var lineItemRecord = params.lineItemRecord
	var lineItemObject = params.lineItemObject
	var warehouse = params.warehouse
	var incoming = params.incoming

	var material = lineItemRecord.get('Material')[0]
	var quantity = lineItemRecord.get('Quantity')
	var reason = shipment.get('Type')

	if (lineItemObject) {

		objectQuantity = lineItemObject.quantity

		var regex = /^([+-])=(\d+)$/
		if (typeof objectQuantity == 'number') {
			quantity = lineItemObject.quantity
		}
		else if (typeof objectQuantity == 'string' && regex.test(objectQuantity)) {

			var match = objectQuantity.match(regex)
			if (match.length == 3) {
				var quantityString = match[1] + match[2]
				quantity += Number(quantityString)
			}
		}
	}

	return {
		"Material": material,
		"Quantity": quantity,
		"Incoming": incoming,
		"Reason": reason,
		"Warehouse": warehouse,
		"Shipment": shipment.id,
		"Shipment Line Item": lineItemRecord.id
	}
}

function sanitizeLineItems(lineItems) {

	if (lineItems.constructor != Array) {
		lineItems = [lineItems]
	}
	else {
		lineItems = lineItems.slice()
	}

	for (var i = 0; i < lineItems.length; i++) {

		var lineItem = lineItems[i]
		if (lineItem.material === undefined || lineItem.quantity === undefined) {
			throw new Error('every object in lineItems must have a material and a quantity')
			return
		}
	}

	return lineItems
}

function recordToObject(record) {

	var object = record.fields
	object.id = record.id
	object.createdTime = record._rawJson.createdTime

	for(var key in object) {

		var value = object[key]
		if (value.constructor == Array && value.length > 0) {

			var first = value[0]
			if (typeof first == 'object' && isRecordId(first.id) && typeof first.get == 'function') {

				var nestedRecords = value
				for(var i = 0; i < nestedRecords.length; i++) {
					nestedRecords[i] = recordToObject(nestedRecords[i])
				}
			}
		}
	}

	return object
}

function isRecordId(value) {
	var regex = new RegExp('^rec[a-zA-Z0-9]{14}$')
	return typeof value == 'string' && regex.test(value)
}

module.exports.create = create
module.exports.receive = receive








