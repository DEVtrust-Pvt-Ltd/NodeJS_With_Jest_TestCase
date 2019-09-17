
var assert = require('assert')
var shipstationHelper = require('../routes/fulfillment/shipstation-helper')

describe('shipstation helper', function () {

	this.timeout(5000)

	it('gets a tag id for a tag', function (done) {

		shipstationHelper.getTagId('shyp-chicago').then(function (tagId) {

			//console.log('tagId: ' + JSON.stringify(tagId))
			try {
				assert.equal(tagId, 54221)
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
		
		shipstationHelper.getOrders({
			query: {
				tag: 'test'
			}
		}).then(function (orders) {

			try {
				assert(orders)
				assert.equal(orders.constructor, Array)
				assert.equal(orders.length, 1)
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