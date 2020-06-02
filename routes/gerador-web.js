const path = require('path')
const Param = require('../models/param')

const geradorCvs = require('../lib/gerador-cvs')

const GeradorOfManagerClass = require('../lib/gerador-ofmanager')
const GeradorQas = require('../lib/gerador-qas')

const TIPO_LISTAGEM = require('../lib/constants').TIPO_LISTAGEM

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

                // TODO - Modificar pra false
                mostrarCommitsLocais: true
            })

            const gerador = obterTipoGerador(req.body.tipoListagem, params)
            const listaSaida = await gerador.gerarListaArtefato()

            resp.json(listaSaida)

        } catch (error) {

            resp.status(BAD_REQUEST_CODE).send({ message: error.message })
        }
    })

    app.post('/obterListaArtefatoCsv', async function (req, resp) {

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

            const gerador = obterTipoGerador(req.body.tipoListagem, params)
            const listaSaida = await gerador.gerarListaArtefato()
            const csv = geradorCvs.obterSaidaCsv(listaSaida)

            resp.json(csv)

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

    function obterTipoGerador(tipoListagem, params) {

        if (tipoListagem == TIPO_LISTAGEM.QAS)
            return new GeradorQas(params)

        return new GeradorOfManagerClass(params)
    }
}