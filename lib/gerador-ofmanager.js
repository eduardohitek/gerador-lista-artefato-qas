const Tarefa = require('../models/tarefa')
const Artefato = require('../models/artefato-ofmanager')

const geradorUtil = require('../util/gerador-util')

module.exports = (params) => {

    return {

        gerarListaArtefato: async () => {

            try {
                const gerador = require('./gerador')(params)
                const listaPromiseComandoGit = await gerador.obterListaPromiseComandoGit()
                let listaArquivo = await gerador.executarListaPromiseComandoGit(listaPromiseComandoGit)

                listaArquivo = gerador.tratarArquivoRenomeado(listaArquivo)
                listaArquivo = gerador.tratarArquivoDeletado(listaArquivo)
                listaArquivo = gerador.tratarArquivoAdicionado(listaArquivo)

                const listaTarefa = agruparArtefatoPorTarefa(listaArquivo)
                const listaSaida = obterListaSaidaTarefa(listaTarefa)

                return listaSaida

            } catch (error) {
                throw new Error(error.message)
            }
        }
    }

    function obterListaSaidaTarefa(listaTarefa) {

        return listaTarefa.map(tarefa => {

            let saida = {}

            saida.numTarefaSaida = tarefa.numeroTarefa
            saida.listaArtefatoSaida = tarefa.listaArtefato.map(artefato => {
                return {
                    nomeArtefato: artefato.nomeArtefato,
                    nomeAntigoArtefato: artefato.nomeAntigoArtefato,
                    nomeNovoArtefato: artefato.nomeNovoArtefato,
                    tipoArtefato: artefato.tipoArtefato,
                    tipoAlteracao: artefato.tipoAlteracao,
                    numeroAlteracao: artefato.numeroAlteracao
                }
            })

            return saida
        })
    }

    function agruparArtefatoPorTarefa(listaArquivo) {

        return listaArquivo.reduce((listaRetorno, arquivoReduce) => {

            const novaTarefa = new Tarefa({
                numeroTarefa: arquivoReduce.commit.numeroTarefa,
                listaArtefato: []
            })

            const novoArtefato = new Artefato({
                nomeArtefato: arquivoReduce.nomeArquivo,
                nomeNovoArtefato: arquivoReduce.commit.nomeNovoArquivo,
                nomeAntigoArtefato: arquivoReduce.commit.nomeAntigoArquivo,
                tipoAlteracao: arquivoReduce.commit.tipoAlteracao,
                tipoArtefato: obterTipoArtefato(arquivoReduce.nomeArquivo)
            })

            if (!listaRetorno.length) {

                novaTarefa.listaArtefato.push(novoArtefato)
                listaRetorno.push(novaTarefa)

            } else {

                let tarefaEncontrada = listaRetorno.find(tarefa =>
                    tarefa.numeroTarefa === novaTarefa.numeroTarefa)

                if (tarefaEncontrada) {

                    let artefatoEncontrado = tarefaEncontrada.listaArtefato.find(artefato =>
                        artefato.nomeArtefato === novoArtefato.nomeArtefato && 
                            artefato.tipoAlteracao === arquivoReduce.commit.tipoAlteracao
                    )

                    if (artefatoEncontrado && arquivoReduce.commit.isTipoAlteracaoRenomear()) {

                        if (!artefatoEncontrado.nomeAntigoArtefato)
                            artefatoEncontrado.nomeAntigoArtefato = arquivoReduce.commit.nomeAntigoArquivo
            
                        artefatoEncontrado.nomeNovoArtefato = arquivoReduce.commit.nomeNovoArquivo
                    }

                    if (artefatoEncontrado)
                        artefatoEncontrado.numeroAlteracao += 1
                    else
                        tarefaEncontrada.listaArtefato.push(novoArtefato)
                } else {

                    novaTarefa.listaArtefato.push(novoArtefato)
                    listaRetorno.push(novaTarefa)
                }
            }

            return listaRetorno

        }, []).sort(ordenarListaTarefa)
    }

    function ordenarListaTarefa(tarefaA, tarefaB) {
        return tarefaA.numeroTarefa.localeCompare(tarefaB.numeroTarefa)
    }

    function obterTipoArtefato(nomeArtefato) {
        return {
            extensao: geradorUtil.obterExtensaoArquivo(nomeArtefato)
        }
    }
}