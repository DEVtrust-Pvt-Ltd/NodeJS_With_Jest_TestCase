

var Promise = require('promise')
var _ = require('underscore')
var mapper = require('./material-mapper')
var FulfillmentProvider = require('./fulfillment-provider')

var Filter = require('airtable-filter')
var Airtable = require('airtable')
var base = Airtable.base('appol9s2hdEW22p5m')
var FulfillmentProviders = base('Fulfillment Providers')
var Containers = base('Containers')
const PriorityMappings = base('Fulfillment Priority Mappings')

function FulfillmentEstimator(params) {

}

FulfillmentEstimator.prototype.orderFromShipstation = function (order) {

	const fulfillmentPriorityMappingFilter = new Filter(PriorityMappings)
	fulfillmentPriorityMappingFilter.where('From').isEqualTo(order.requestedShippingService)
	return fulfillmentPriorityMappingFilter.first().then((priorityMapping) => {

		if (priorityMapping) {
			shippingMethod = priorityMapping.get('To Code')[0]
		}
		else if (order.requestedShippingService == 'free' || order.requestedShippingService == 'expedited') {
			shippingMethod = order.requestedShippingService
		}
		else if (order.paymentMethod == 'amazon_marketplace') {
			shippingMethod = 'expedited'
		}
		else {
			shippingMethod = 'free'
		}

		var shipTo = order.shipTo
		var newOrder = {
			destination: {
				name: shipTo.name,
				company: shipTo.company,
				street1: shipTo.street1,
				street2: shipTo.street2,
				street3: shipTo.street3,
				city: shipTo.city,
				state: shipTo.state,
				postal_code: shipTo.postalCode,
				country: shipTo.country,
				phone: shipTo.phone,
				residential: shipTo.residential,
				addressVerified: shipTo.addressVerified
			},
			orderId: order.orderNumber,
			shippingMethod: shippingMethod
		}

		var items = []
		_.each(order.items, function (item) {

			if (!item.adjustment) {

				items.push({
					sku: item.sku,
					quantity: item.quantity
				})
			}
		})

		newOrder.items = items
		return newOrder
	})
	/*
	var shippingServiceMap = {}
	shippingServiceMap['Ground Shipping (3-10 business days)'] = 'free'
	shippingServiceMap['Expedited Shipping (2-5 business days)'] = 'expedited'
	shippingServiceMap['Std Cont US Street Addr'] = 'expedited'
	shippingServiceMap['Std US D2D Dom'] = 'expedited'
	shippingServiceMap['expedited'] = 'expedited'
	shippingServiceMap['free'] = 'free'
	*/
}

/*
Target data structure

{
	order: {
		destination: {
			name: 'shipTo.name',
			company: 'shipTo.company',
			street1: 'shipTo.street1',
			street2: 'shipTo.street2',
			street3: 'shipTo.street3',
			city: 'shipTo.city',
			state: 'shipTo.state',
			postal_code: 'shipTo.postalCode',
			country: 'shipTo.country',
			phone: 'shipTo.phone',
			residential: 'shipTo.residential',
			addressVerified: 'shipTo.addressVerified'
		},
		items: [{
			sku: '1234',
			quantity: 1
		}],
		orderId: 'ORDER1234',
		shippingMethod: 'free'
	},
	fulfillmentProvider: {
		name: 'shipTo.name',
		company: 'shipTo.company',
		street1: 'shipTo.street1',
		street2: 'shipTo.street2',
		street3: 'shipTo.street3',
		city: 'shipTo.city',
		state: 'shipTo.state',
		postal_code: 'shipTo.postalCode',
		country: 'shipTo.country',
		phone: 'phone',
		perItemPrice: 1.23,
		perShipmentPrice: 1.23,
		id: 'rec1234567890'
	},
	priorityLevel: {
		name: '',
		description: '',
		code: '',
		id: 'rec1234567890'
	},
	strategy: {
		name: '',
		id: ''
	}
	bins: [{
		usedSpace: 0.123,
		weight: 1.23,
		container: {
			length: 1,
			width: 1,
			height: 1,
			weight: 1.23,
			price: 0.12,
			name: '',
			type: 'carton',
			id: 'rec1234567890'
		},
		items: [{
			sku: '1234',
			quantity: 1
		}],
		rate: {
			weight: 1.2,
			zone: 8,
			price: 12.34,
			carrierClass: {
				name: '',
				shipsIn: {
					min: 1,
					max: 5
				},
				deliveryIn: {
					min: 1,
					max: 3
				},
				saturdayDelivery: true,
				description: '',
				carrier: 'usps',
				class: 'priority',
				fuelSurcharge: 0.05,
				fulfillmentProviderCode: 'USPS_PRIORITY',
				id: 'rec1234567890'
			},
			id: 'rec1234567890'
		},
	}],
	totalPrice: 12.34,
	fuelSurcharge: 12.34,
	bins: 1.23,
	postage: 12.34,
	packing: 1.23,
	picking: 1.23
}
*/

FulfillmentEstimator.prototype.estimate = function (params) {

	var order = params.order
	var method = params.method

	if (method && (method != 'free' && method != 'expedited' && method != 'overnight')) {
		throw new Error('method must be free, expedited, or overnight')
	}

	if (!order) {
		throw new Error('order is a required parameter')
	}

	var destination = order.destination
	if (!destination) {
		throw new Error('order must have a destination')
	}

	if (!destination.postal_code) {
		throw new Error('destination must have a postal_code')
	}

	if (!destination.country) {
		throw new Error('destination must have a country')
	}

	if (!order.origin) {
		order.origin = {}
	}

	var items = order.items
	if (!items || items.constructor != Array) {
		throw new Error('order must have an array of items')
	}

	for (var i = 0; i < items.length; i++) {
		var item = items[i]

		if (!item.sku) {
			console.log('item in order ' + order.orderId + ' at index ' + i + ' must have a sku')
			throw new Error('item in order ' + order.orderId + ' at index ' + i + ' must have a sku')
		}

		if (!item.quantity) {
			throw new Error('item in order ' + order.orderId + ' at index ' + i + ' must have a quantity')
		}
	}

	var mappedRate

	return mapper.addMaterialsToOrder(order).then(function (mapped) {

		mappedRate = mapped
		//console.log('mappedRate: ' + JSON.stringify(mappedRate))
		var filterFulfillmentProviders = new Filter(FulfillmentProviders)
		filterFulfillmentProviders.where('Name').isEqualTo('EFS')
		filterFulfillmentProviders.include('Containers', Containers)
		return filterFulfillmentProviders.all()

	}).then(function (allProviders) {

		var config = allProviders[0] //for now this only supports one fulfillment provider
		if (!config) {
			throw new Error('No fulfillment providers found')
		}


		var fulfillmentProvider = new FulfillmentProvider({
			config: config
		})

		return fulfillmentProvider.estimate({
			order: mappedRate,
			method: method
		})

	})
}

module.exports = FulfillmentEstimator


