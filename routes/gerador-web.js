const path = require('path')
const Param = require('../models/param')

const { Parser } = require('json2csv');

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

            const myCars = [
                {
                    "car": "Audi",
                    "price": 40000,
                    "color": "blue"
                }, {
                    "car": "BMW",
                    "price": 35000,
                    "color": "black"
                }, {
                    "car": "Porsche",
                    "price": 60000,
                    "color": "green"
                }
            ];

            const fields = [{
                label: 'Car Name',
                value: 'car'
            }, {
                label: 'Price USD',
                value: 'price'
            }];

            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(myCars);

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