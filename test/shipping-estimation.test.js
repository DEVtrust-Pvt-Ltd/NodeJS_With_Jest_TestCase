

var assert = require('assert')
var request = require('supertest')
var server = require('../index').server

/*
function within(actual, expected, accuracy) {
	console.log('actual: ' + actual + ', expected: ' + expected + ', accuracy: ' + accuracy)
	var diff = Math.abs(actual - expected)
	return diff / expected <= accuracy
}
*/

describe('shipping cost estimator', function () {

	this.timeout(10000)

	it('Straw Hat Bike Helmet x1 to zone 7', function (done) {
		request(server)
			.post('/fulfillment/estimate.json')
			.send({
				//order #11718
	           "rate": {
	               "origin": {
	                   "country": "US",
	                   "postal_code": "49686",
	                   "province": "MI",
	                   "city": "Traverse City",
	                   "name": null,
	                   "address1": "807 Airport Access Rd., Unit D",
	                   "address2": null,
	                   "address3": null,
	                   "phone": null,
	                   "fax": null,
	                   "address_type": null,
	                   "company_name": null
	               },
	               "destination": {
	                   "country": "US",
	                   "postal_code": "98118",
	                   "province": "WA",
	                   "city": "Seattle",
	                   "name": "Jon Gaull",
	                   "address1": "1234 Not a St.",
	                   "address2": null,
	                   "address3": null,
	                   "phone": "9085817628",
	                   "fax": null,
	                   "address_type": null,
	                   "company_name": null
	               },
	               "items": [
	                   {
	                       "name": "Straw Hat Bike Helmet / L - US Medium / Helmet + Cover",
	                       "sku": "SQ5561275",
	                       "quantity": 1,
	                       "grams": 0,
	                       "price": 17900,
	                       "vendor": "Bike Pretty",
	                       "requires_shipping": true,
	                       "taxable": true,
	                       "fulfillment_service": "manual"
	                   }
	               ],
	               "currency": "USD"
	           }
	        })
			.expect(200)
			.then(function (res) {

				try {
					//console.log('res: ' + JSON.stringify(res))
					assert(res)
					var text = res.text
					assert(text)

					var data = JSON.parse(text)
					assert(data)

					var rates = data.rates
					assert(rates)
					assert.equal(rates.constructor, Array)
					assert.equal(rates.length, 2)

					var rate

					rate = rates[1]
					assert(rate)
					assert.equal(rate.service_name, 'Free Shipping')
					assert.equal(rate.description, 'Arrives in 3-9 business days')
					assert.equal(rate.service_code, 'free')
					assert.equal(rate.currency, 'USD')
					assert.equal(rate.total_price / 100, 47.54)
					assert.strictEqual(rate.phone_required, undefined)
					assert.strictEqual(rate.min_delivery_date, undefined)
					assert.strictEqual(rate.max_delivery_date, undefined)

					rate = rates[0]
					assert(rate)
					assert.equal(rate.service_name, 'Expedited Shipping')
					assert.equal(rate.description, 'Arrives in 1-5 business days')
					assert.equal(rate.service_code, 'expedited')
					assert.equal(rate.currency, 'USD')
					assert.equal(rate.total_price / 100, 31.85) //old value 31.71
					assert.strictEqual(rate.phone_required, undefined)
					assert.strictEqual(rate.min_delivery_date, undefined)
					assert.strictEqual(rate.max_delivery_date, undefined)

					done()
				}
				catch (e) {
					done(e)
					return
				}

			}, function (error) {
				done(error)
			})
	})

	it('Straw Hat Bike Helmet x1 to zone 4', function (done) {
		request(server)
			.post('/fulfillment/estimate.json')
			.send({
	           "rate": {
	               "origin": {
	                   "country": "US",
	                   "postal_code": "49686",
	                   "province": "MI",
	                   "city": "Traverse City",
	                   "name": null,
	                   "address1": "807 Airport Access Rd., Unit D",
	                   "address2": null,
	                   "address3": null,
	                   "phone": null,
	                   "fax": null,
	                   "address_type": null,
	                   "company_name": null
	               },
	               "destination": {
	                   "country": "US",
	                   "postal_code": "18018",
	                   "province": "PA",
	                   "city": "Bethlehem",
	                   "name": "Jon Gaull",
	                   "address1": "1817 Wilson Ave.",
	                   "address2": null,
	                   "address3": null,
	                   "phone": "9085817628",
	                   "fax": null,
	                   "address_type": null,
	                   "company_name": null
	               },
	               "items": [
	                   {
	                       "name": "Straw Hat Bike Helmet / L - US Medium / Helmet + Cover",
	                       "sku": "SQ5561275",
	                       "quantity": 1,
	                       "grams": 0,
	                       "price": 17900,
	                       "vendor": "Bike Pretty",
	                       "requires_shipping": true,
	                       "taxable": true,
	                       "fulfillment_service": "manual"
	                   }
	               ],
	               "currency": "USD"
	           }
	        })
			.expect(200)
			.then(function (res) {

				try {
					//console.log('res: ' + JSON.stringify(res))
					assert(res)
					var text = res.text
					assert(text)

					var data = JSON.parse(text)
					assert(data)

					var rates = data.rates
					assert(rates)
					assert.equal(rates.constructor, Array)
					assert.equal(rates.length, 2)

					var rate
					rate = rates[0]
					assert(rate)
					assert.equal(rate.service_name, 'Expedited Shipping')
					assert.equal(rate.description, 'Arrives in 1-5 business days')
					assert.equal(rate.service_code, 'expedited')
					assert.equal(rate.currency, 'USD')
					assert.equal(rate.total_price / 100, 14.62)
					assert.strictEqual(rate.phone_required, undefined)
					assert.strictEqual(rate.min_delivery_date, undefined)
					assert.strictEqual(rate.max_delivery_date, undefined)

					rate = rates[1]
					assert(rate)
					assert.equal(rate.service_name, 'Free Shipping')
					assert.equal(rate.description, 'Arrives in 3-9 business days')
					assert.equal(rate.service_code, 'free')
					assert.equal(rate.currency, 'USD')
					assert.equal(rate.total_price / 100, 28.76)
					assert.strictEqual(rate.phone_required, undefined)
					assert.strictEqual(rate.min_delivery_date, undefined)
					assert.strictEqual(rate.max_delivery_date, undefined)
					
					done()
				}
				catch (e) {
					done(e)
					return
				}

			}, function (error) {
				done(error)
			})
	})

	it('Yakkay Paris Oilskin x1 to zone 6', function (done) {
		request(server)
			.post('/fulfillment/estimate.json')
			.send({
				//order #11691
	           "rate": {
	               "origin": {
	                   "country": "US",
	                   "postal_code": "49686",
	                   "province": "MI",
	                   "city": "Traverse City",
	                   "name": null,
	                   "address1": "807 Airport Access Rd., Unit D",
	                   "address2": null,
	                   "address3": null,
	                   "phone": null,
	                   "fax": null,
	                   "address_type": null,
	                   "company_name": null
	               },
	               "destination": {
	                   "country": "US",
	                   "postal_code": "70112",
	                   "province": "LA",
	                   "city": "NEW ORLEANS",
	                   "name": "Jon Gaull",
	                   "address1": "1234 Not a St.",
	                   "address2": null,
	                   "address3": null,
	                   "phone": "9085817628",
	                   "fax": null,
	                   "address_type": null,
	                   "company_name": null
	               },
	               "items": [
	                   {
	                       "name": "Yakkay Paris Oilskin Bike Helmet / L - US Medium / Helmet + Cover",
	                       "sku": "SQ4563607",
	                       "quantity": 1,
	                       "grams": 0,
	                       "price": 13500,
	                       "vendor": "Bike Pretty",
	                       "requires_shipping": true,
	                       "taxable": true,
	                       "fulfillment_service": "manual"
	                   }
	               ],
	               "currency": "USD"
	           }
	        })
			.expect(200)
			.then(function (res) {

				try {
					//console.log('res: ' + JSON.stringify(res))
					assert(res)
					var text = res.text
					assert(text)

					var data = JSON.parse(text)
					assert(data)

					var rates = data.rates
					assert(rates)
					assert.equal(rates.constructor, Array)
					assert.equal(rates.length, 2)

					var rate

					rate = rates[1]
					assert(rate)
					assert.equal(rate.service_name, 'Free Shipping')
					assert.equal(rate.description, 'Arrives in 3-9 business days')
					assert.equal(rate.service_code, 'free')
					assert.equal(rate.currency, 'USD')
					assert.equal(rate.total_price / 100, 25.26)
					assert.strictEqual(rate.phone_required, undefined)
					assert.strictEqual(rate.min_delivery_date, undefined)
					assert.strictEqual(rate.max_delivery_date, undefined)

					rate = rates[0]
					assert(rate)
					assert.equal(rate.service_name, 'Expedited Shipping')
					assert.equal(rate.description, 'Arrives in 1-5 business days')
					assert.equal(rate.service_code, 'expedited')
					assert.equal(rate.currency, 'USD')
					assert.equal(rate.total_price / 100, 16.58)
					assert.strictEqual(rate.phone_required, undefined)
					assert.strictEqual(rate.min_delivery_date, undefined)
					assert.strictEqual(rate.max_delivery_date, undefined)

					done()
				}
				catch (e) {
					done(e)
					return
				}

			}, function (error) {
				done(error)
			})
	})

	it('Straw Hat Bike Helmet x1 and Tokyo Pink Jazz x1 to zone 4', function (done) {
		request(server)
			.post('/fulfillment/estimate.json')
			.send({
				//order #11678
	           "rate": {
	               "origin": {
	                   "country": "US",
	                   "postal_code": "49686",
	                   "province": "MI",
	                   "city": "Traverse City",
	                   "name": null,
	                   "address1": "807 Airport Access Rd., Unit D",
	                   "address2": null,
	                   "address3": null,
	                   "phone": null,
	                   "fax": null,
	                   "address_type": null,
	                   "company_name": null
	               },
	               "destination": {
	                   "country": "US",
	                   "postal_code": "21117",
	                   "province": "MD",
	                   "city": "OWINGS MILLS",
	                   "name": "Jon Gaull",
	                   "address1": "1234 Not a St.",
	                   "address2": null,
	                   "address3": null,
	                   "phone": "9085817628",
	                   "fax": null,
	                   "address_type": null,
	                   "company_name": null
	               },
	               "items": [
	                   {
	                       "name": "Straw Hat Bike Helmet / XL - US Large / Helmet + Cover",
	                       "sku": "SQ8094389",
	                       "quantity": 1,
	                       "grams": 0,
	                       "price": 17900,
	                       "vendor": "Bike Pretty",
	                       "requires_shipping": true,
	                       "taxable": true,
	                       "fulfillment_service": "manual"
	                   },
	                   {
	                       "name": "Yakkay Tokyo Pink Jazz / XL - US Large / Cover Only",
	                       "sku": "SQ6635811",
	                       "quantity": 1,
	                       "grams": 0,
	                       "price": 5900,
	                       "vendor": "Bike Pretty",
	                       "requires_shipping": true,
	                       "taxable": true,
	                       "fulfillment_service": "manual"
	                   }
	               ],
	               "currency": "USD"
	           }
	        })
			.expect(200)
			.then(function (res) {

				try {
					//console.log('res: ' + JSON.stringify(res))
					assert(res)
					var text = res.text
					assert(text)

					var data = JSON.parse(text)
					assert(data)

					var rates = data.rates
					assert(rates)
					assert.equal(rates.constructor, Array)
					assert.equal(rates.length, 2)

					var rate

					rate = rates[1]
					assert(rate)
					assert.equal(rate.service_name, 'Free Shipping')
					assert.equal(rate.description, 'Arrives in 3-9 business days')
					assert.equal(rate.service_code, 'free')
					assert.equal(rate.currency, 'USD')
					assert.equal(rate.total_price / 100, 29.31)
					assert.strictEqual(rate.phone_required, undefined)
					assert.strictEqual(rate.min_delivery_date, undefined)
					assert.strictEqual(rate.max_delivery_date, undefined)

					rate = rates[0]
					assert(rate)
					assert.equal(rate.service_name, 'Expedited Shipping')
					assert.equal(rate.description, 'Arrives in 1-5 business days')
					assert.equal(rate.service_code, 'expedited')
					assert.equal(rate.currency, 'USD')
					assert.equal(rate.total_price / 100, 15.17)
					assert.strictEqual(rate.phone_required, undefined)
					assert.strictEqual(rate.min_delivery_date, undefined)
					assert.strictEqual(rate.max_delivery_date, undefined)

					done()
				}
				catch (e) {
					done(e)
					return
				}

			}, function (error) {
				done(error)
			})
	})

	it('Straw Hat Bike Helmet x2 to zone 8', function (done) {
		request(server)
			.post('/fulfillment/estimate.json')
			.send({
				//order #11513
	           "rate": {
	               "origin": {
	                   "country": "US",
	                   "postal_code": "49686",
	                   "province": "MI",
	                   "city": "Traverse City",
	                   "name": null,
	                   "address1": "807 Airport Access Rd., Unit D",
	                   "address2": null,
	                   "address3": null,
	                   "phone": null,
	                   "fax": null,
	                   "address_type": null,
	                   "company_name": null
	               },
	               "destination": {
	                   "country": "US",
	                   "postal_code": "94086",
	                   "province": "CA",
	                   "city": "Sunnyvale",
	                   "name": "Jon Gaull",
	                   "address1": "1234 Not a St.",
	                   "address2": null,
	                   "address3": null,
	                   "phone": "9085817628",
	                   "fax": null,
	                   "address_type": null,
	                   "company_name": null
	               },
	               "items": [
	                   {
	                       "name": "Straw Hat Bike Helmet / M - US Small / Helmet + Cover",
	                       "sku": "SQ8962260",
	                       "quantity": 2,
	                       "grams": 0,
	                       "price": 17900,
	                       "vendor": "Bike Pretty",
	                       "requires_shipping": true,
	                       "taxable": true,
	                       "fulfillment_service": "manual"
	                   }
	               ],
	               "currency": "USD"
	           }
	        })
			.expect(200)
			.then(function (res) {

				try {
					//console.log('res: ' + JSON.stringify(res))
					assert(res)
					var text = res.text
					assert(text)

					var data = JSON.parse(text)
					assert(data)

					var rates = data.rates
					assert(rates)
					assert.equal(rates.constructor, Array)
					assert.equal(rates.length, 2)

					var rate

					rate = rates[1]
					assert(rate)
					assert.equal(rate.service_name, 'Free Shipping')
					assert.equal(rate.description, 'Arrives in 3-9 business days')
					assert.equal(rate.service_code, 'free')
					assert.equal(rate.currency, 'USD')
					assert.equal(rate.total_price / 100, 55.31)
					assert.strictEqual(rate.phone_required, undefined)
					assert.strictEqual(rate.min_delivery_date, undefined)
					assert.strictEqual(rate.max_delivery_date, undefined)

					rate = rates[0]
					assert(rate)
					assert.equal(rate.service_name, 'Expedited Shipping')
					assert.equal(rate.description, 'Arrives in 1-5 business days')
					assert.equal(rate.service_code, 'expedited')
					assert.equal(rate.currency, 'USD')
					assert.equal(rate.total_price / 100, 60.42) //old value 60.19
					assert.strictEqual(rate.phone_required, undefined)
					assert.strictEqual(rate.min_delivery_date, undefined)
					assert.strictEqual(rate.max_delivery_date, undefined)

					done()
				}
				catch (e) {
					done(e)
					return
				}

			}, function (error) {
				done(error)
			})
	})

	it('Straw Hat Bike Helmet x2 to zone 4', function (done) {
		request(server)
			.post('/fulfillment/estimate.json')
			.send({
				//order #11517
	           "rate": {
	               "origin": {
	                   "country": "US",
	                   "postal_code": "49686",
	                   "province": "MI",
	                   "city": "Traverse City",
	                   "name": null,
	                   "address1": "807 Airport Access Rd., Unit D",
	                   "address2": null,
	                   "address3": null,
	                   "phone": null,
	                   "fax": null,
	                   "address_type": null,
	                   "company_name": null
	               },
	               "destination": {
	                   "country": "US",
	                   "postal_code": "08247",
	                   "province": "NJ",
	                   "city": "Stone Harbor",
	                   "name": "Jon Gaull",
	                   "address1": "1234 Not a St.",
	                   "address2": null,
	                   "address3": null,
	                   "phone": "9085817628",
	                   "fax": null,
	                   "address_type": null,
	                   "company_name": null
	               },
	               "items": [
	                   {
	                       "name": "Straw Hat Bike Helmet / M - US Small / Helmet + Cover",
	                       "sku": "SQ8962260",
	                       "quantity": 1,
	                       "grams": 0,
	                       "price": 17900,
	                       "vendor": "Bike Pretty",
	                       "requires_shipping": true,
	                       "taxable": true,
	                       "fulfillment_service": "manual"
	                   },
	                   {
	                       "name": "Straw Hat Bike Helmet / L - US Medium / Helmet + Cover",
	                       "sku": "SQ5561275",
	                       "quantity": 1,
	                       "grams": 0,
	                       "price": 17900,
	                       "vendor": "Bike Pretty",
	                       "requires_shipping": true,
	                       "taxable": true,
	                       "fulfillment_service": "manual"
	                   }
	               ],
	               "currency": "USD"
	           }
	        })
			.expect(200)
			.then(function (res) {

				try {
					//console.log('res: ' + JSON.stringify(res))
					assert(res)
					var text = res.text
					assert(text)

					var data = JSON.parse(text)
					assert(data)

					var rates = data.rates
					assert(rates)
					assert.equal(rates.constructor, Array)
					assert.equal(rates.length, 2)

					var rate

					rate = rates[1]
					assert(rate)
					assert.equal(rate.service_name, 'Free Shipping')
					assert.equal(rate.description, 'Arrives in 3-9 business days')
					assert.equal(rate.service_code, 'free')
					assert.equal(rate.currency, 'USD')
					//assert.equal(rate.total_price / 100, 10.45) //I'm not sure how EFS got such cheap postage on this...
					assert.equal(rate.total_price / 100, 29.86)
					assert.strictEqual(rate.phone_required, undefined)
					assert.strictEqual(rate.min_delivery_date, undefined)
					assert.strictEqual(rate.max_delivery_date, undefined)

					rate = rates[0]
					assert(rate)
					assert.equal(rate.service_name, 'Expedited Shipping')
					assert.equal(rate.description, 'Arrives in 1-5 business days')
					assert.equal(rate.service_code, 'expedited')
					assert.equal(rate.currency, 'USD')
					assert.equal(rate.total_price / 100, 17.07)
					assert.strictEqual(rate.phone_required, undefined)
					assert.strictEqual(rate.min_delivery_date, undefined)
					assert.strictEqual(rate.max_delivery_date, undefined)

					done()
				}
				catch (e) {
					done(e)
					return
				}

			}, function (error) {
				done(error)
			})
	})

})