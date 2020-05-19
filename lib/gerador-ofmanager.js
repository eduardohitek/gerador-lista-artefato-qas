const util = require('util')
const path = require('path')
const exec = util.promisify(require('child_process').exec)
const fs = require('fs-extra')

const Comando = require('../models/comando-git')
const Arquivo = require('../models/arquivo')
const Tarefa = require('../models/tarefa')
const Artefato = require('../models/artefato')
const SaidaVO = require('../models/saida-vo')

const geradorUtil = require('../util/gerador-util')

module.exports = (params) => {

    return {

        gerarListaArtefato: async () => {

            try {
                const listaPromiseComandoGit = await obterListaPromiseComandoGit()
                let listaArquivo = await executarListaPromiseComandoGit(listaPromiseComandoGit)

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

            let saida = new SaidaVO()

            saida.listaNumTarefaSaida.push(tarefa.numeroTarefa)
            saida.listaArtefatoSaida = tarefa.listaArtefato

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
                        artefato.nomeArtefato === novoArtefato.nomeArtefato
                    )

                    if (artefatoEncontrado)
                        artefatoEncontrado.numeroAlteracao += 1
                    else
                        tarefaEncontrada.listaArtefato.push(novoArtefato)
                }
            }

            return listaRetorno

        }, []).sort(ordenarListaTarefa)
    }

    function ordenarListaTarefa(tarefaA, tarefaB) {
        return tarefaA.numeroTarefa.localeCompare(tarefaB.numeroTarefa)
    }

    async function obterListaPromiseComandoGit() {

        return params.listaProjeto.reduce((accum, caminhoProjeto) => {

            if (fs.existsSync(caminhoProjeto)) {

                accum.push(exec(Comando(caminhoProjeto, params.autor, params.listaTarefa,
                    params.mostrarCommitsLocais)))

            } else {
                throw new Error(`Projeto ${caminhoProjeto} não encontrado`)
            }

            return accum
        }, [])
    }

    async function executarListaPromiseComandoGit(listaPromiseComandoGit) {

        let listaCommitArquivo = []

        await Promise.all(listaPromiseComandoGit).then(listaRetornoComandoGit => {

            for (const index in listaRetornoComandoGit) {

                if (listaRetornoComandoGit[index].stdout) {

                    const nomeProjeto = path.basename(params.listaProjeto[index])
                    const lista = obterListaCommitArquivo(
                        listaRetornoComandoGit[index].stdout, nomeProjeto)

                    listaCommitArquivo.push.apply(listaCommitArquivo, lista)
                }
            }
        })

        return listaCommitArquivo
    }

    function obterListaCommitArquivo(saida, nomeProjeto) {

        const listaSaidaTask = saida.split(/\n{2,}/g)

        return listaSaidaTask.reduce((accum, saidaTask) => {

            const numeroTarefa = saidaTask.match(/[^\r\n]+/g)[0].match(/task.*\d/i)[0].match(/\d+/)[0]
            const listaArquivo = saidaTask.match(/[^\r\n]+/g).slice(1)

            accum.push.apply(accum,
                listaArquivo.map(arquivo => new Arquivo(nomeProjeto, numeroTarefa, arquivo)))

            return accum
        }, [])
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

        return listaArquivo.reduce((listaRetorno, arquivo) => {

            arquivo.commit.isTipoAlteracaoRenomear() &&

                listaRetorno
                    .filter(arquivoFilter =>
                        arquivoFilter.nomeArquivo === arquivo.commit.nomeAntigoArquivo)
                    .forEach(arquivoRenomeado =>
                        arquivoRenomeado.nomeArquivo = arquivo.commit.nomeNovoArquivo)

            return listaRetorno

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