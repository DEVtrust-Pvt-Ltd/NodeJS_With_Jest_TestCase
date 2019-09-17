

var FulfillmentStrategy = require('./fulfillment-strategy')
var Promise = require('promise')
var Filter = require('airtable-filter')
var _ = require('underscore')
var deepcopy = require('deepcopy')

var Airtable = require('airtable')
var base = Airtable.base('appol9s2hdEW22p5m')
var Containers = base('Containers')
var SKUs = base('SKUs')
var FulfillmentStrategies = base('Fulfillment Strategies')
var FulfillmentPriorityLevel = base('Fulfillment Priority Levels')

var BinPacking = require('./bin-packing')
var binPacking = new BinPacking({
	apiToken: 'e030c61f82f4ca579f147f12fac8adfc',
	username: 'jon@bikepretty.com'
})

function FulfillmentProvider(params) {

	this.config = params.config
	if (!this.config) {
		throw new Error('config is a required paramter')
	}
}

FulfillmentProvider.prototype.estimate = function (params) {

	var method = params.method

	var order = deepcopy(params.order)
	if (!order) {
		throw new Error('order is a required parameter')
	}

	order.origin.country = this.config.get('Ship From Country')
	order.origin.postal_code = this.config.get('Ship From Zip')
	order.origin.province = this.config.get('Ship From State')
	order.origin.city = this.config.get('Ship From City')
	order.origin.address1 = this.config.get('Ship From Address Line 1')
	order.origin.address2 = this.config.get('Ship From Address Line 2')
	order.origin.phone = this.config.get('Ship From Phone')

	var fulfillmentStrategies
	var self = this

	var fulfillmentStrategiesFilter = new Filter(FulfillmentStrategies)
	fulfillmentStrategiesFilter.where('Fulfillment Provider').isEqualTo(this.config.id)
	if (method) {
		fulfillmentStrategiesFilter.where('Priority Level Code').contains(method)
	}

	fulfillmentStrategiesFilter.include('Carrier Classes', base('Carrier Classes'))
	fulfillmentStrategiesFilter.include('Fulfillment Priority Level', FulfillmentPriorityLevel)
	return fulfillmentStrategiesFilter.all().then(function (strategies) {

		fulfillmentStrategies = strategies
		if (fulfillmentStrategies.length == 0) {
			throw new Error('no Fulfillment Strategies found')
		}

		var skus = []
		_.each(order.items, function (item) {

			_.each(item.fulfillmentMaterials, function (fulfillmentSku) {
				skus.push(fulfillmentSku.sku)
			})
		})

		var skusFilter = new Filter(SKUs)
		skusFilter.where('SKU').isContainedIn(skus)
		skusFilter.where('Fulfillment Provider').isEqualTo(self.config.id)
		return skusFilter.all()

	}).then(function (skus) {

		if (skus.length == 0) {
			throw new Error('no skus found')
		}

		var orderCopy = deepcopy(order)

		_.each(orderCopy.items, function (item) {

			_.each(item.fulfillmentMaterials, function (material) {

				for (var i = 0; i < skus.length; i++) {

					var sku = skus[i]
					if (sku.get('SKU') == material.sku) {
						material.record = sku
						break
					}
				}
			})
		})
		//console.log('orderCopy: ' + JSON.stringify(orderCopy))
		var promises = []
		_.each(fulfillmentStrategies, function (strategyData) {

			var fulfillmentStrategy = new FulfillmentStrategy({
				config: strategyData,
				fulfillmentProvider: self.config,
				order: order
			})

			promises.push(fulfillmentStrategy.estimate({
				order: orderCopy
			}).then((estimate) => {
				return estimate
			}, (error) => {
				//console.log('estimation error:', error.message)
				return undefined
			}))
		})

		return Promise.all(promises)

	}).then(function (estimates) {

		const filteredEstimates = estimates.filter(estimate => {
			return estimate !== undefined
		})

		if (!filteredEstimates || filteredEstimates.length == 0) {
			throw new Error('No estimates found')
		}

		var bestEstimates = {}
		_.each(filteredEstimates, function (estimate) {

			const fulfillmentPriorities = estimate.strategy.get('Fulfillment Priority Level')
			_.each(fulfillmentPriorities, (fulfillmentPriority) => {

				var code = fulfillmentPriority.get('Code')
				var previousEstimate = bestEstimates[code]

				if (previousEstimate === undefined || previousEstimate.totalPrice > estimate.totalPrice) {
					bestEstimates[code] = estimate
				}
			})
		})

		var uniqueEstimates = []
		for (var code in bestEstimates) {

		    if (bestEstimates.hasOwnProperty(code)) {
		        uniqueEstimates.push(bestEstimates[code])
		    }
		}

		return uniqueEstimates.sort((a, b) => {
			return a.totalPrice > b.totalPrice
		})
	})
}

module.exports = FulfillmentProvider


