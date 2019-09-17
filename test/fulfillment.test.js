

var assert = require('assert')
var request = require('supertest')
var server = require('../index').server

describe('fulfillment system', function () {

	it('generates the EFS orders CSV', function (done) {

		request(server)
			.get('/fulfillment/efs/orders.csv?tag=test')
			.send()
			.expect(200)
			.then(function (res) {
					//console.log('res: ' + JSON.stringify(res))
					assert(res)
					done()

			}).catch(function (e) {
				console.log('e: ' + e.stack)
				done(e)
			})
	})

	it('maps a valid sku to fulfillment materials', async () => {

		let response
		try {
			response = await request(server)
				.get('/fulfillment/map/SQ5561275')
				.send()
				.expect(200)
		}
		catch (error) {
			return error
		}

		let data
		try {
			data = JSON.parse(response.text)
		}
		catch (error) {
			return error
		}
		
		assert.deepEqual(data, {
			mapped: {
				sku: "SQ5561275",
				materials: [{
					sku: "686751115622",
					quantity: 1
				}, {
					sku: "5710047200497",
					quantity: 1
				}]
			}
		})
	})
	
	//npm test fulfillment -t "order assignment"
	describe.only('order assignment', () => {
		
		beforeAll(() => {
			// Set up some mocked out file info before each test
			const shipstation = require('node-shipstation')
			shipstation.addMock('./get-tags.json', 'getTags')
			//load the mock data at the start of the test
			shipstation.addMock('./create-update-order.json', 'updateOrder')
			shipstation.addMock('./get-order.json', 'getOrder', 549045237)
		})

		it('assigns a shipstation order to a fulfillment center', async () => {

			const shipstationId = 549045237
			const response = await request(server)
				.post(`/fulfillment/assign/${shipstationId}`)
				.send()
				.expect(200)

			const data = JSON.parse(response.text)

			assert.deepEqual(data, {
				assigned: [{
					orderId: 'test',
					shipstationId: shipstationId,
					assignedTo: 'efs'
				}]
			})
		})

		it('fails to locate the order in Shipstation', async () => {

			const shipstationId = 549045237

			const response = await request(server)
				.post(`/fulfillment/assign/${shipstationId}`)
				.send()
				.expect(404)

			console.log('response:', JSON.stringify(response))

			let data
			data = JSON.parse(response.text)

			assert.deepEqual(data, {
				error: {
					code: 404,
					message: `Order with Shipstation ID ${shipstationId} not found`
				}
			})
		})

		it('contains a line item with no sku', async () => {

			const shipstationId = 549045237
			const response = await request(server)
				.post(`/fulfillment/assign/${shipstationId}`)
				.send()
				.expect(422)

			const data = JSON.parse(response.text)

			assert.deepEqual(data, {
				error: {
					code: 422,
					message: `Order ORDER1234 contains an item with no sku`
				}
			})
		})

		it('fails to locate the SKU in TradeGecko', async () => {

			const shipstationId = 549045237
			const response = await request(server)
				.post(`/fulfillment/assign/${shipstationId}`)
				.send()
				.expect(422)

			const data = JSON.parse(response.text)

			assert.deepEqual(data, {
				error: {
					code: 422,
					message: `SKU SQ12345 was not found in TradeGecko.`
				}
			})
		})

		it('fails when the order is pending fulfillment', async () => {

			const shipstationId = 549045237
			const response = await request(server)
				.post(`/fulfillment/assign/${shipstationId}`)
				.send()
				.expect(422)

			const data = JSON.parse(response.text)

			assert.deepEqual(data, {
				error: {
					code: 422,
					message: `Order ORDER1234 is has the pending fulfillment tag. Orders which are pending fulfillment cannot be assigned`
				}
			})
		})

		it('fails when the order has already been assigned', async () => {

			const shipstationId = 549045237
			const response = await request(server)
				.post(`/fulfillment/assign/${shipstationId}`)
				.send()
				.expect(422)

			const data = JSON.parse(response.text)

			assert.deepEqual(data, {
				error: {
					code: 422,
					message: `Order ORDER1234 has already been assigned to a fulfillment provider`
				}
			})
		})

		it('fails when the order has an invalid address', async () => {

			const shipstationId = 549045237
			const response = await request(server)
				.post(`/fulfillment/assign/${shipstationId}`)
				.send()
				.expect(422)

			const data = JSON.parse(response.text)

			assert.deepEqual(data, {
				error: {
					code: 422,
					message: `Order ORDER1234 has an invalid address`
				}
			})
		})

		it('fails when the order cannot be shipped by a single fulfillment provider', async () => {

			const shipstationId = 549045237
			const response = await request(server)
				.post(`/fulfillment/assign/${shipstationId}`)
				.send()
				.expect(422)

			const data = JSON.parse(response.text)

			assert.deepEqual(data, {
				error: {
					code: 422,
					message: `Order ORDER1234 cannot be fulfilled by a single fulfillment provider. It must be manually split and assigned`
				}
			})
		})
			
	})

})