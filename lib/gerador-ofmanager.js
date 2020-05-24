const path = require('path')

const Tarefa = require('../models/tarefa')
const Artefato = require('../models/artefato-ofmanager')

const geradorUtil = require('../util/gerador-util')

const gerador = require('./gerador')

module.exports = (params) => {

    return {

        gerarListaArtefato: async () => {

            try {
                const listaPromiseComandoGit = await gerador.obterListaPromiseComandoGit(params)
                let listaArquivo = await gerador.executarListaPromiseComandoGit(listaPromiseComandoGit, params)

                listaArquivo = tratarArquivoRenomeado(listaArquivo)
                listaArquivo = tratarArquivoDeletado(listaArquivo)
                listaArquivo = tratarArquivoAdicionado(listaArquivo)

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

    function tratarArquivoAdicionado(listaArquivo) {

        return listaArquivo.reduce((listaRetorno, arquivo) => {

            if (arquivo.commit.isTipoAlteracaoAdicionar()) {

                const listaRemover = listaRetorno.filter((arquivoFilter) =>
                    arquivoFilter.nomeArquivo === arquivo.nomeArquivo &&
                    arquivoFilter.commit.numeroTarefa === arquivo.commit.numeroTarefa &&
                    arquivoFilter.commit.isTipoAlteracaoModificacao() &&
                    !arquivoFilter.commit.isTipoAlteracaoAdicionar()
                )

                return listaRetorno.filter((arquivoFilter) =>
                    !listaRemover.find((arquivoFind) =>
                        arquivoFind.nomeArquivo === arquivoFilter.nomeArquivo &&
                        arquivoFind.commit.numeroTarefa === arquivoFilter.commit.numeroTarefa &&
                        arquivoFind.commit.tipoAlteracao === arquivoFilter.commit.tipoAlteracao
                    )
                )
            }

            return listaRetorno

        }, listaArquivo)
    }

    function tratarArquivoRenomeado(listaArquivo) {

        let listaArquivoRenomeado = listaArquivo.filter(
            arquivoFilter => arquivoFilter.commit.isTipoAlteracaoRenomear())

        return listaArquivoRenomeado.reduce((listaArquivoSaida, arquivoRenomeado) => {

            const index = listaArquivoSaida.findIndex(arquivo =>
                arquivo.nomeArquivo === arquivoRenomeado.nomeArquivo &&
                arquivo.commit.tipoAlteracao === arquivoRenomeado.commit.tipoAlteracao
            )

            index >= 0 && 
                listaArquivoSaida.slice(0, index).forEach(arquivo => 
                    arquivo.nomeArquivo = arquivoRenomeado.commit.nomeNovoArquivo)

            return listaArquivoSaida
        }, listaArquivo)
    }

    function tratarArquivoDeletado(listaArquivo) {

        let listaArquivoDeletado = listaArquivo.filter(
            arquivoFilter => arquivoFilter.commit.isTipoAlteracaoDelecao())

        return listaArquivoDeletado.reduce((listaArquivoSaida, arquivoDeletado) => {

            const index = listaArquivo.findIndex(arquivo =>
                arquivo.nomeArquivo === arquivoDeletado.nomeArquivo &&
                arquivo.commit.tipoAlteracao === arquivoDeletado.commit.tipoAlteracao
            )

            listaArquivoSaida = listaArquivo.filter((commitArquivo, indexCommitArquivo) =>
                commitArquivo.nomeArquivo !== arquivoDeletado.nomeArquivo ||
                    commitArquivo.commit.isTipoAlteracaoRenomear() ||
                        indexCommitArquivo >= index
            )

            return listaArquivoSaida
        }, listaArquivo)
    }

    function obterTipoArtefato(nomeArtefato) {
        return {
            extensao: geradorUtil.obterExtensaoArquivo(nomeArtefato)
        }
    }
}