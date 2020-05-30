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

            const fields = [
                {
                    label: 'Número de Alterações',
                    value: 'numeroAlteracao'
                },
                {
                    label: 'Nome dos artefatos',
                    value: 'listaNomeArtefato'
                },
                {
                    label: 'O que será feito',
                    value: 'numeroTarefa'
                }
            ];

            const gerador = obterTipoGerador(req.body.tipoListagem, params)
            const listaSaida = await gerador.gerarListaArtefato()

            const listaSaidaCVS = listaSaida.reduce((listaRetorno, saida) => {

                const obj = {}

                // TODO - Colocar num util da vida
                if (saida.listaNumeroTarefaSaida.length === 1)
                    obj.numeroTarefa = `Tarefa nº ${saida.listaNumeroTarefaSaida[0]}`
                else if (saida.listaNumeroTarefaSaida.length > 1) {
                    obj.numeroTarefa = `Tarefas nº ${saida.listaNumeroTarefaSaida.join(', ')}`
                }

                obj.numeroAlteracao = saida.listaArtefatoSaida.length

                obj.listaNomeArtefato = saida.listaArtefatoSaida.map(artefato =>  
                    artefato.nomeArtefato
                ).join('\n')

                listaRetorno.push(obj)

                return listaRetorno
            },[])

            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(listaSaidaCVS);

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