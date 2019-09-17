
var assert = require('assert')

describe('material mapper', function () {

	it('adds materials to the order', function (done) {

		var materialMapper = require('../routes/fulfillment/material-mapper')

		var order = {
			"orderId": 307831506,
			"orderNumber": "12345",
			"orderKey": "manual-4ba78ee487ce4f2f8e3fffacdff776f9",
			"orderDate": "2017-06-27T01:28:55.7670000",
			"createDate": "2017-06-27T01:28:55.7500000",
			"modifyDate": "2017-06-27T01:28:55.4870000",
			"paymentDate": "2017-06-27T01:28:55.7670000",
			"shipByDate": null,
			"orderStatus": "awaiting_shipment",
			"customerId": 155829723,
			"customerUsername": "jon@bikepretty.com",
			"customerEmail": "jon@bikepretty.com",
			"billTo": {
				"name": "Jon Gaull",
				"company": null,
				"street1": null,
				"street2": null,
				"street3": null,
				"city": null,
				"state": null,
				"postalCode": null,
				"country": null,
				"phone": null,
				"residential": null,
				"addressVerified": null
			},
			"shipTo": {
				"name": "Jon Gaull",
				"company": "",
				"street1": "3425 23RD ST APT 23",
				"street2": "",
				"street3": null,
				"city": "SAN FRANCISCO",
				"state": "CA",
				"postalCode": "94110-3049",
				"country": "US",
				"phone": "9085817628",
				"residential": true,
				"addressVerified": "Address validated successfully"
			},
			"items": [{
				"orderItemId": 450807857,
				"lineItemKey": null,
				"sku": "SQ5561275",
				"name": "Straw Hat Bike Helmet / L - US Medium / Helmet + Cover",
				"imageUrl": null,
				"weight": {
					"value": 32,
					"units": "ounces",
					"WeightUnits": 1
				},
				"quantity": 1,
				"unitPrice": 0,
				"taxAmount": null,
				"shippingAmount": null,
				"warehouseLocation": null,
				"options": [],
				"productId": 25648830,
				"fulfillmentSku": null,
				"adjustment": false,
				"upc": null,
				"createDate": "2017-06-27T01:28:55.767",
				"modifyDate": "2017-06-27T01:28:55.767"
			}, {
				"orderItemId": 450807858,
				"lineItemKey": null,
				"sku": "SQ0392751",
				"name": "Yakkay Tokyo Pink Jazz / L - US Medium / Cover Only",
				"imageUrl": null,
				"weight": {
					"value": 7,
					"units": "ounces",
					"WeightUnits": 1
				},
				"quantity": 1,
				"unitPrice": 0,
				"taxAmount": null,
				"shippingAmount": null,
				"warehouseLocation": null,
				"options": [],
				"productId": 30691323,
				"fulfillmentSku": null,
				"adjustment": false,
				"upc": null,
				"createDate": "2017-06-27T01:28:55.767",
				"modifyDate": "2017-06-27T01:28:55.767"
			}, {
				"orderItemId": 504333057,
				"lineItemKey": "",
				"sku": "",
				"name": "Discount",
				"imageUrl": "",
				"weight": {
					"value": 0,
					"units": "ounces",
					"WeightUnits": 1
				},
				"quantity": 1,
				"unitPrice": -30,
				"taxAmount": null,
				"shippingAmount": null,
				"warehouseLocation": "",
				"options": [],
				"productId": null,
				"fulfillmentSku": null,
				"adjustment": true,
				"upc": null,
				"createDate": "2017-10-20T11:53:12.713",
				"modifyDate": "2017-10-20T11:53:12.713"
			}],
			"orderTotal": 0,
			"amountPaid": 0,
			"taxAmount": 0,
			"shippingAmount": 0,
			"customerNotes": null,
			"internalNotes": null,
			"gift": false,
			"giftMessage": null,
			"paymentMethod": null,
			"requestedShippingService": null,
			"carrierCode": null,
			"serviceCode": null,
			"packageCode": null,
			"confirmation": "none",
			"shipDate": null,
			"holdUntilDate": null,
			"weight": {
				"value": 39,
				"units": "ounces",
				"WeightUnits": 1
			},
			"dimensions": null,
			"insuranceOptions": {
				"provider": null,
				"insureShipment": false,
				"insuredValue": 0
			},
			"internationalOptions": {
				"contents": null,
				"customsItems": null,
				"nonDelivery": null
			},
			"advancedOptions": {
				"warehouseId": 40111,
				"nonMachinable": false,
				"saturdayDelivery": false,
				"containsAlcohol": false,
				"mergedOrSplit": false,
				"mergedIds": [],
				"parentId": null,
				"storeId": 84742,
				"customField1": null,
				"customField2": null,
				"customField3": null,
				"source": null,
				"billToParty": null,
				"billToAccount": null,
				"billToPostalCode": null,
				"billToCountryCode": null,
				"billToMyOtherAccount": null
			},
			"tagIds": [54221],
			"userId": null,
			"externallyFulfilled": false,
			"externallyFulfilledBy": null
		}

		materialMapper.addMaterialsToOrder(order).then(function (order) {

			try {
				assert(order)

				var items = order.items
				assert(items)
				assert.equal(items.constructor, Array)
				assert.equal(items.length, 2)

				//item 0
				var materials = items[0].fulfillmentMaterials
				assert(materials)
				assert.equal(materials.constructor, Array)
				assert.equal(materials.length, 2)

				assert.equal(materials[0].sku, '686751115622')
				assert.equal(materials[0].quantity, 1)
				assert.equal(materials[1].sku, '5710047200497')
				assert.equal(materials[1].quantity, 1)

				//item 1
				materials = items[1].fulfillmentMaterials
				assert(materials)
				assert.equal(materials.constructor, Array)
				assert.equal(materials.length, 1)

				assert.equal(materials[0].sku, '5710047100919')
				assert.equal(materials[0].quantity, 1)

				done()
			}
			catch (e) {
				done(e)
			}

		}, function (error) {
			done(error)
		})
	})

	it('adds materials to the order', function (done) {

		var order = {
			"orderId": 344912731,
			"orderNumber": "ORDER1038",
			"orderKey": "11679498243",
			"orderDate": "2017-10-30T15:51:27.0000000",
			"createDate": "2017-10-30T17:14:13.5970000",
			"modifyDate": "2017-10-30T17:14:14.1270000",
			"paymentDate": "2017-10-30T15:51:27.0000000",
			"shipByDate": null,
			"orderStatus": "awaiting_shipment",
			"customerId": 242068973,
			"customerUsername": "12844138499",
			"customerEmail": "zymurbrian@gmail.com",
			"billTo": {
				"name": "Brian Handshoe",
				"company": null,
				"street1": null,
				"street2": null,
				"street3": null,
				"city": null,
				"state": null,
				"postalCode": null,
				"country": null,
				"phone": null,
				"residential": null,
				"addressVerified": null
			},
			"shipTo": {
				"name": "Brian Handshoe",
				"company": null,
				"street1": "2155 PFE RD",
				"street2": "",
				"street3": null,
				"city": "ROSEVILLE",
				"state": "CA",
				"postalCode": "95747-9765",
				"country": "US",
				"phone": "(916) 782-1725",
				"residential": false,
				"addressVerified": "Address validated successfully"
			},
			"items": [{
				"orderItemId": 509151786,
				"lineItemKey": "23348248579",
				"sku": "SQ5667147",
				"name": "Nature Friends Backpack Purse",
				"imageUrl": "https://cdn.shopify.com/s/files/1/1330/8683/products/2016-Hot-Fashion-Sale-Saddle-Floral-Flap-Cover-Bags-Leather-PU-Embroidery-Women-s-Handbags-Messenger.jpg?v=1506146230",
				"weight": {
					"value": 0,
					"units": "ounces",
					"WeightUnits": 1
				},
				"quantity": 1,
				"unitPrice": 89,
				"taxAmount": null,
				"shippingAmount": null,
				"warehouseLocation": null,
				"options": [],
				"productId": null,
				"fulfillmentSku": null,
				"adjustment": false,
				"upc": "",
				"createDate": "2017-10-30T17:14:13.69",
				"modifyDate": "2017-10-30T17:14:13.69"
			}],
			"orderTotal": 95.45,
			"amountPaid": 95.45,
			"taxAmount": 6.45,
			"shippingAmount": 0,
			"customerNotes": null,
			"internalNotes": null,
			"gift": false,
			"giftMessage": null,
			"paymentMethod": "shopify_payments",
			"requestedShippingService": "Ground Shipping (3-10 business days)",
			"carrierCode": null,
			"serviceCode": null,
			"packageCode": null,
			"confirmation": "none",
			"shipDate": null,
			"holdUntilDate": null,
			"weight": {
				"value": 0,
				"units": "ounces",
				"WeightUnits": 1
			},
			"dimensions": null,
			"insuranceOptions": {
				"provider": null,
				"insureShipment": false,
				"insuredValue": 0
			},
			"internationalOptions": {
				"contents": null,
				"customsItems": null,
				"nonDelivery": null
			},
			"advancedOptions": {
				"warehouseId": 167605,
				"nonMachinable": false,
				"saturdayDelivery": false,
				"containsAlcohol": false,
				"mergedOrSplit": false,
				"mergedIds": [],
				"parentId": null,
				"storeId": 175927,
				"customField1": null,
				"customField2": null,
				"customField3": null,
				"source": "web",
				"billToParty": null,
				"billToAccount": null,
				"billToPostalCode": null,
				"billToCountryCode": null,
				"billToMyOtherAccount": null
			},
			"tagIds": null,
			"userId": null,
			"externallyFulfilled": false,
			"externallyFulfilledBy": null
		}

		var materialMapper = require('../routes/fulfillment/material-mapper')
		materialMapper.addMaterialsToOrder(order).then(function (order) {

			try {
				assert(order)

				var items = order.items
				assert(items)
				assert.equal(items.constructor, Array)
				assert.equal(items.length, 1)

				//item 0
				var materials = items[0].fulfillmentMaterials
				assert(materials)
				assert.equal(materials.constructor, Array)
				assert.equal(materials.length, 1)

				assert.equal(materials[0].sku, 'Nature Friends Backpack Purse')
				assert.equal(materials[0].quantity, 1)

				done()
			}
			catch (e) {
				done(e)
			}

		}, function (error) {
			done(error)
		})
	})

})