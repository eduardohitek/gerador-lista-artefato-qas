#!/usr/bin/env node

init()

async function init() {

    const commander = require('./config/commander')

    if (commander.projeto && commander.autor && commander.task && commander.diretorio) {

        require('./routes/gerador-cli')(commander)

    } else if (commander.server) {

        const PORT = require('./lib/constants').PORT
        const HOST = require('./lib/constants').HOST

        const app = require('./config/express')
        const open = require('open')

        await require('./config/http')(app)
        await require('./routes/gerador-web')(app)

        // TODO Descomentar
        // open(`http://${HOST}:${PORT}`, { app: 'firefox' })

    } else {
        commander.outputHelp()
    }
}