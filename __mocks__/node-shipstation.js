'use strict'

const shipstation = require('node-shipstation')
const path = require('path')

let mocks = {}
shipstation.addMock = (path, functionName, params = '') => {
    const key = getKey(functionName, params)
    const value = require(path)
    mocks[key] = value
    return this
}

shipstation.clearMocks = () => {
    mocks = {}
}

shipstation.getTags = callback => {

    const mock = mocks[getKey('getTags')]
    callback(
        mock.error, 
        mock.response,
        mock.body
    )
}

shipstation.getOrder = (id, callback) => {
    const mock = mocks[getKey('getOrder')]
    callback(
        mock.error, 
        mock.response,
        mock.body
    )
}

shipstation.updateOrder = (id, changes, callback) => {
    const mock = mocks[getKey('updateOrder')]
    callback(
        mock.error, 
        mock.response,
    )
    
}

function getKey(functionName, params = '') {
    let key = functionName
    let paramsString = JSON.stringify(params)
    if (paramsString) {
        key += `.${paramsString}`
    }
    return key
}

module.exports = shipstation;