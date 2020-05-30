const path = require('path')
const Param = require('../models/param')

const { Parser, transforms: { unwind }  } = require('json2csv')

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
                mostrarCommitsLocais: req.body.mostrarCommitsLocais
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

            // https://stackoverflow.com/questions/20620771/how-to-parse-json-object-to-csv-file-using-json2csv-nodejs-module

            const listaSaida = [
                {
                    "carModel": "BMW",
                    "price": 15000,
                    "items": [
                        {
                            "name": "airbag",
                            "color": "white"
                        }, {
                            "name": "dashboard",
                            "color": "black"
                        }
                    ]
                }, {
                    "carModel": "Porsche",
                    "price": 30000,
                    "items": [
                        {
                            "name": "airbag",
                            "items": [
                                {
                                    "position": "left",
                                    "color": "white"
                                }, {
                                    "position": "right",
                                    "color": "gray"
                                }
                            ]
                        }, {
                            "name": "dashboard",
                            "items": [
                                {
                                    "position": "left",
                                    "color": "gray"
                                }, {
                                    "position": "right",
                                    "color": "black"
                                }
                            ]
                        }
                    ]
                }
            ];

            const fields = ['carModel', 'price', 'items.name', 'items.color', 'items.items.position', 'items.items.color'];
            const transforms = [unwind({ paths: ['items', 'items.items'] })];
            const json2csvParser = new Parser({ fields, transforms });
            const csv = json2csvParser.parse(listaSaida);

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
            return require('../lib/gerador-qas')(params)

        return require('../lib/gerador-ofmanager')(params)
    }
}