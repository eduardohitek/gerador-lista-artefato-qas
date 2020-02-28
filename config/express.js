const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')

const app = express()

app.use(express.json())

app.use(express.static(path.join(__dirname, '../public')))

app.use('/css/bootstrap.min.css', express.static(path.join(__dirname, '../node_modules/bootstrap/dist/css/bootstrap.min.css')))
app.use('/css/angular-block-ui.min.css', express.static(path.join(__dirname, '../node_modules/angular-block-ui/dist/angular-block-ui.min.css')))

app.use('/js/lib/angular.min.js', express.static(path.join(__dirname, '../node_modules/angular/angular.min.js')))
app.use('/js/lib/angular-route.min.js', express.static(path.join(__dirname, '../node_modules/angular-route/angular-route.min.js')))
app.use('/js/lib/angular-resource.min.js', express.static(path.join(__dirname, '../node_modules/angular-resource/angular-resource.min.js')))
app.use('/js/lib/angular-block-ui.min.js', express.static(path.join(__dirname, '../node_modules/angular-block-ui/dist/angular-block-ui.min.js')))
app.use('/js/lib/ng-device-detector.min.js', express.static(path.join(__dirname, '../node_modules/ng-device-detector/ng-device-detector.min.js')))
app.use('/js/lib/re-tree.min.js', express.static(path.join(__dirname, '../node_modules/re-tree/re-tree.min.js')))

app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.json())

module.exports = app