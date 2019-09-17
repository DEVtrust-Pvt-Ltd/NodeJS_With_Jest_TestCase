
var Promise = require('promise')
var Filter = require('airtable-filter')
var _ = require('underscore')

var Airtable = require('airtable')
var base = Airtable.base('appol9s2hdEW22p5m')
var Containers = base('Containers')
var Rates = base('Rates')

var CarrierClass = require('./carrier-class')
var BinPacking = require('./bin-packing')
var binPacking = new BinPacking({
	apiToken: 'e030c61f82f4ca579f147f12fac8adfc',
	username: 'jon@bikepretty.com'
})

function FulfillmentStrategy(params) {

	this.config = params.config
	if (!this.config) {
		throw new Error('config is a required paramter')
	}

	this.fulfillmentProvider = params.fulfillmentProvider
	if (!this.fulfillmentProvider) {
		throw new Error('fulfillmentProvider is a required paramter')
	}

	this.order = params.order
	if (!this.order) {
		throw new Error('order is a required paramter')
	}
}

FulfillmentStrategy.prototype.estimate = function (params) {

	var order = params.order
	if (!order) {
		throw new Error('order is a required parameter')
	}

	var self = this
	var containers
	var zone
	var packedBins
	var carrierClasses
	var allMaterials = []
	var numItems = 0
	var numBins = 0

	return new Promise(function (fulfill, reject) {

		var containersFilter = new Filter(Containers)
		containersFilter.where('Fulfillment Provider').isEqualTo(self.fulfillmentProvider.id)

		var customCondition = self.config.get('Containers Filter')
		if (customCondition && customCondition != '') {
			containersFilter.id.addCondition(customCondition)
		}

		containersFilter.all().then(function (allContainers) {

			containers = allContainers

			if (!containers || containers.length == 0) {
				throw new Error('No containers found for Fulfillment Strategy ' + self.config.get('Name'))
			}

			var bins = []
			_.each(containers, function (container) {

				bins.push({
					w: container.get('Width'),
					h: container.get('Height'),
					d: container.get('Length'),
					max_wg: 0,
					id: container.id
				})
			})

			var items = []
			_.each(order.items, function (item) {

				_.each(item.fulfillmentMaterials, function (material) {

					var record = material.record
					var quantity = material.quantity * item.quantity

					numItems += quantity

					allMaterials.push(material)
					items.push({
						w: record.get('Scaled Width'),
						h: record.get('Scaled Height'),
						d: record.get('Scaled Length'),
						wg: record.get('Weight'),
						id: material.sku,
						q: quantity
					})
				})
			})

			var params = {
				bins: bins,
				items: items
			}
			//console.log('params: ' + JSON.stringify(params))
			return binPacking.packIntoMany(params)

		}).then(function (bins) {

			packedBins = bins.packed
			order.bins = bins.packed
			
			numBins = packedBins.length
			if (numBins == 0) {
				throw new Error('could not package order')
			}

			let numPackedMaterials = 0;
			_.each(order.bins, function (bin) {

				for (var j = 0; j < containers.length; j++) {

					var container = containers[j]
					if (container.id == bin.bin_data.id) {
						bin.container = container
						break
					}
				}

				numPackedMaterials += bin.items.length
				_.each(bin.items, function (item) {

					for (var i = 0; i < allMaterials.length; i++) {

						var material = allMaterials[i]
						if (material.sku == item.id) {
							item.material = material
							break
						}
					}
				})
			})

			if (numPackedMaterials < numItems) {
				throw new Error('Fulfillment Strategy ' + self.config.get('Name') + ' could not pack all items in order')
			}

			carrierClasses = self.config.get('Carrier Classes')

			if (carrierClasses.length == 0) {
				throw new Error('Fulfillment Strategies must have at least one Carrier Class')
			}

			var promises = []
			var binIndex = 0
			_.each(order.bins, (bin) => {
				_.each(carrierClasses, (carrierClassData) => {

					const bindex = binIndex
					const carrierClass = new CarrierClass({
						config: carrierClassData
					})

					promises.push(carrierClass.estimatePostage({
						order,
						binIndex: bindex
					}).then((rate) => {

						//const previousRate = rates[bindex]
						const previousRate = bin.rate
						if (previousRate && rate) {
							const previousPrice = previousRate.get('Price')
							const price = rate.get('Price')
							if (price < previousPrice) {
								bin.rate = rate
								bin.carrierClass = carrierClassData
							}
						}
						else if (rate) {
							bin.rate = rate
							bin.carrierClass = carrierClassData
						}
					}))
				})

				++binIndex
			})
			//console.log('order: ' + JSON.stringify(order))
			return Promise.all(promises)

		}).then(function () {

			var postagePrice = 0
			var containersPrice = 0
			let fuelSurcharge = 0
			let usingCarrierClasses = []
			for (var i = 0; i < packedBins.length; i++) {

				const bin = packedBins[i]
				const binPostagePrice = bin.rate.get('Price')
				postagePrice += binPostagePrice
				containersPrice += bin.container.get('Price')
				fuelSurcharge += Math.ceil(((bin.carrierClass.get('Fuel Surcharge') / 100) * binPostagePrice) * 100) / 100
				usingCarrierClasses.push(bin.carrierClass)
			}

			containersPrice = Math.ceil(containersPrice * 100) / 100

			const perPackagePrice = self.fulfillmentProvider.get('Per Shipment Price') * numBins
			const perItemPrice = self.fulfillmentProvider.get('Per Item Price') * numItems
			const totalPrice = Math.round((postagePrice + perPackagePrice + perItemPrice + containersPrice + fuelSurcharge) * 100)
			//console.log('\nCARRIER: ' + self.config.get('Name'))
			//console.log('totalPrice: ' + totalPrice + ',perPackagePrice: ' + perPackagePrice + ', perItemPrice: ' + perItemPrice + ', postagePrice: ' + postagePrice + ', containersPrice: ' + containersPrice + ', fuelSurcharge: ' + fuelSurcharge)

			var priorityLevel = self.config.get('Fulfillment Priority Level')[0]

			fulfill({
				strategy: self.config,
				carrierClasses: usingCarrierClasses,
				totalPrice: totalPrice,
				priceDetails: {
					fuelSurcharge: fuelSurcharge,
					bins: containersPrice,
					postage: postagePrice,
					packing: perPackagePrice,
					picking: perItemPrice
				},
				bins: packedBins,
				order: order
			})

		}).catch(function (e) {
			reject(e)
		})
	})
}

module.exports = FulfillmentStrategy


