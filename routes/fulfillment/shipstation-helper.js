
var Promise = require('promise')
var _ = require('underscore')


var ShipStation = require('node-shipstation')
var shipstation = new ShipStation('aaefcfabe77b4cafa8471a59f4c657c0', '22748056156841a0a442f5472fc5e3cb')

var materialMapper = require('./material-mapper')

function getOrder(id) {

	if (!id) {
		throw new Error('Error: id is a required parameter')
	}

	return new Promise(function (fulfill, reject) {

		shipstation.getOrder(id, function (err, response, body) {

			if (err) {
				return reject(err)
			}

			return fulfill(body)
		})

	})
}

function getTags() {
	
	return new Promise(function (fulfill, reject) {

		shipstation.getTags(function (err, response, body) {

			if (err) {
				return reject(err)
			}

			return fulfill(body)
		})
	})
}

function getOrders(req) {

	var tag = req.query.tag

	if (!tag) {
		throw new Error('Error: tag is a required parameter')
	}

	return getTagId(tag).then(function (tagId) {

		return new Promise(function (fulfill, reject) {

			shipstation.getOrdersByTag({
				orderStatus: 'awaiting_shipment',
				tagId: tagId
			}, function (err, response, body) {

				if (err) {
					return reject(err)
				}

				return fulfill(body)
			})
		})

	}).then(function (result) {
		return result
	})
}

function getTagId(tagName) {

	return new Promise(function (fulfill, reject) {

		shipstation.getTags(function (err, response, body) {

			if (err) {
				return reject(err)
			}

			return fulfill(body)
		})

	}).then(function (tags) {

		for (var i = 0; i < tags.length; i++) {

			var tag = tags[i]
			if (tag.name == tagName) {
				tagId = tag.tagId
				return tag.tagId
			}
		}
	})
}

function post(url, data) {
	return new Promise(function (fulfill, reject) {

		shipstation.post(url, data, function (err, response, body) {

			if (err) {
				console.log('err: ' + JSON.stringify(err))
				return reject(err)
			}
			//console.log('body: ' + JSON.stringify(body))
			return fulfill(body)
		})
	})
}

function updateOrder(id, changes) {
	return new Promise(function (resolve, reject) {
		ShipStation.updateOrder(id,changes, function (err, response, body) {
			if (err) {
				console.log('err: ' + JSON.stringify(err))
				return reject(err)
			}
			return resolve(response.body)
		})
	})
}

module.exports.getTagId = getTagId
module.exports.getOrders = getOrders
module.exports.post = post
module.exports.getOrder = getOrder
module.exports.updateOrder= updateOrder