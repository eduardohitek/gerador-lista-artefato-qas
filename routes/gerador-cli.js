const path = require('path')
const Param = require('../models/param')

const GeradorOfManager = require('../lib/gerador-ofmanager')
const GeradorQas = require('../lib/gerador-qas')

const { TIPO_LISTAGEM }  = require('../lib/constants')

module.exports = async function (commander) {

    init()

    async function init() {

        try {
            commander.projeto = obterListaProjeto()

            delete commander.diretorio

            const params = new Param({
                autor: commander.autor,
                listaTarefa: commander.task,
                listaProjeto: commander.projeto,
                mostrarDeletados: commander.mostrarDeletados,
                mostrarRenomeados: commander.mostrarRenomeados,
                mostrarCommitsLocais: commander.mostrarCommitsLocais,
                mostrarNumModificacao: commander.mostrarNumModificacao
            })

            const gerador = obterTipoGerador(commander.listagem, params)
            const listaSaida = await gerador.gerarListaArtefato()
            const printer = require('../lib/printer')(params, listaSaida)

            printer.imprimirListaSaida()

        } catch ({ message }) {

            console.log(message)
        }

        function obterListaProjeto() {
            return commander.projeto.map(function (nomeProjeto) {
                return path.join(commander.diretorio, nomeProjeto)
            })
        }

        function obterTipoGerador(tipoListagem, params) {

            if (tipoListagem == TIPO_LISTAGEM.QAS)
                return new GeradorQas(params)
    
            return new GeradorOfManager(params)
        }
    }
}