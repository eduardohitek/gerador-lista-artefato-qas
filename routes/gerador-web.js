const path = require('path')
const Param = require('../models/param')

module.exports = function (app) {

    const BAD_REQUEST_CODE = 400

    app.post('/gerarListaArtefato', async function (req, resp) {

        try {
            const params = new Param({
                autor: req.body.autor,
                listaTarefa: req.body.listaTarefa,
                listaProjeto: req.body.listaProjeto,
                mostrarDeletados: req.body.mostrarDeletados,
                mostrarRenomeados: req.body.mostrarRenomeados,
                mostrarNumModificacao: req.body.mostrarNumModificacao,
                mostrarCommitsLocais: req.body.mostrarCommitsLocais
            })

            const gerador = require('../lib/gerador-ofmanager')(params)
            const listaSaida = await gerador.gerarListaArtefato()

            resp.json(listaSaida)

        } catch (error) {

            resp.status(BAD_REQUEST_CODE).send({ message: error.message })
        }
    })

    app.post('/listarDiretorio', async function (req, resp) {

        try {
            const diretorio = require('../lib/diretorio')(req.body)
            const listaSaida = await diretorio.listarDiretorio()

            resp.json(listaSaida)

        } catch (error) {

            resp.status(BAD_REQUEST_CODE).send({ message: error.message })
        }
    })

    // AngularJS html5mode com Node.js e Express
    app.all('/*', function (req, res) {
        res.sendFile(path.join(__dirname, '../public/gerador.html'))
    });
}