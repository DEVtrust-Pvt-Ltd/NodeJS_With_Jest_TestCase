
var AsciiTable = require('ascii-table')
var _ = require('underscore')
var Filter = require('airtable-filter')

var base = require('../../index').base
var SalesChannelProducts = base(base.tables['Sales Channel Products'])
var SalesChannelSKUs = base(base.tables['Sales Channel SKUs'])

function sync(req, res) {

	var platformName = req.query.platform

	if (!platformName) {
		throw new Error('platform is a required paramater')
	}

	if (platformName != 'Amazon') {
		throw new Error('channel ' + salesChannel + ' is not a supported sales channel')
	}

	var products
	var skus

	var salesChannelProducts = new Filter(SalesChannelProducts)
	salesChannelProducts.where('Sales Channel').isEqualTo(platformName)
	salesChannelProducts.where('Active').isEqualTo(true)
	salesChannelProducts.all({
		sort: [{field: "Name on Channel", direction: "desc"}]
	}).then(function (records) {

		products = records

		var salesChannelSKUs = new Filter(SalesChannelSKUs)
		salesChannelSKUs.id.matchesFieldInFilter('Sales Channel SKUs', salesChannelProducts)
		return salesChannelSKUs.all({
			sort: [{field: "Name on Channel", direction: "desc"}]
		})

	}).then(function (records) {

		skus = records

		var tables = ''
		_.each(products, function (product) {

			var table = new AsciiTable(product.get('Name on Channel'))
			table.setHeading('Product Name', 'Available')

			_.each(skus, function (sku) {

				if (sku.get('Sales Channel Product')[0] == product.id) {
					var name = sku.get('Name on Channel')
					var inventory = sku.get('Hypothetical Inventory')
					table.addRow(name, inventory)
				}
			})

			tables += table.toString()
			tables += '\n\n'
		})

		res.send('<pre>' + tables + '</pre>')

	}, function (error) {
		res.status(500).send(error.stack)
	})
}

module.exports.sync = sync