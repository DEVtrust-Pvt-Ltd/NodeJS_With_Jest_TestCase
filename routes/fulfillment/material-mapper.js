
var Filter = require('airtable-filter')
var _ = require('underscore')
var Promise = require('promise')
var deepcopy = require('deepcopy')

var TradeGecko = require('./trade-gecko')
var tradeGecko = new TradeGecko({
	apiToken: '6b9e025a6bc6bb48330ee911e007a5a98d67676fcf33fed21498e509d1b04d94'
})

function addMaterialsToOrder(order) {

	if (!order) {
		throw new Error('order is a required parameter')
	}

	order = deepcopy(order)

	var mappedItems = []

	var promise = Promise.resolve()

	_.each(order.items, function (item) {

		if (!item.adjustment) {

			promise = promise.then(function () {
				return addMaterialsToItem(item)

			}).then(function (mappedItem) {
				mappedItems.push(mappedItem)
				return Promise.resolve()
			})
		}
	})

	promise = promise.then(function () {
		order.items = mappedItems
		return order
	})

	return promise
}

function addMaterialsToItem(item) {

	if (!item) {
		throw new Error('item is a required parameter')
	}

	item = deepcopy(item)

	var sku = item.fulfillmentSku || item.sku

	if (!sku) {
		throw new Error('item does not contain a fulfillmentSku or a sku')
	}

	item.fulfillmentMaterials = []

	var promise = new Promise(function (fulfill, reject) {

		tradeGecko.loadVariant({
			sku: sku
		}).then(function (variant) {

			if (variant.composite) {
				_.each(variant.composition, function (component) {
					item.fulfillmentMaterials.push({
						sku: component.variant.upc,
						quantity: Number(component.quantity)
					})
				})
			}
			else {
				item.fulfillmentMaterials.push({
					sku: variant.upc,
					quantity: 1
				})
			}

			fulfill(item)

		}, function (error) {
			reject(error)
		})
	})

	return promise
}

module.exports.addMaterialsToOrder = addMaterialsToOrder
module.exports.addMaterialsToItem = addMaterialsToItem


