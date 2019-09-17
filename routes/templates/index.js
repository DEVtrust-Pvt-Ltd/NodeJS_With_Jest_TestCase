
var marked = require('marked')

var express = require('express')
var router = express.Router()

router.get('/design.html', function (req, res) {
	res.render('design')
})

router.post('/render.:ext', function (req, res) {

	var template = req.body.template
	var zapier = req.body.zapier
	var ext = req.params.ext

	if (!template) {
		res.status(500).send('template is a required parameter')
		return
	}

	var data
	try {
		data = JSON.parse(req.body.data)
	}
	catch (e) {
		res.status(500).send('data is not a valid json object')
		return
	}

	if (zapier === undefined) {
		zapier = true
	}

	if (zapier) {
		template = template.replace(/\[\[/g, '{{').replace(/\]\]/g, '}}')
	}

	Liquid = require("liquid-node")
	var engine = new Liquid.Engine
	engine.parseAndRender(template, data).then(function(markdown) {

		if (!markdown) {
			res.status(500).send('Unable to render liquid')
			return
		}

		var html = marked(markdown)

		if (ext == 'json') {

			var responseData = {
				html: html,
				template: template,
				data: data
			}

			res.send(responseData)
		}
		else if (ext == 'html') {
			res.send(html)
		}

	}, function (error) {
		res.status(500).send(error.stack)
	})
})

module.exports = router





