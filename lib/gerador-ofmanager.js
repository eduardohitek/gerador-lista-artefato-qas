const path = require('path')

const Tarefa = require('../models/tarefa')
const Artefato = require('../models/artefato-ofmanager')
const SaidaVO = require('../models/saida-vo')

const TIPO_MODIFICACAO = require('../lib/constants').TIPO_MODIFICACAO
const TIPO_ARTEFATO = require('./constants').TIPO_ARTEFATO

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

        let listaArtefatoAgrupadoPorTarefa = agruparArtefatoPorTarefa(listaArquivo)

        if (!params.mostrarDeletados) {
          listaArtefatoAgrupadoPorTarefa = removerArtefatoDeletado(listaArtefatoAgrupadoPorTarefa)
        }

        const listaSaida = obterListaSaidaTarefa(listaArtefatoAgrupadoPorTarefa)

        return listaSaida

      } catch (error) {
        throw new Error(error.message)
      }
    }
  }

  function obterListaSaidaTarefa(listaArtefatoAgrupadoPorTarefa) {

    return params.listaTarefa.reduce((accumListaSaida, tarefaParam) => {

      // Filtra os artefatos que contem a tarefa do loop
      const tarefa = listaArtefatoAgrupadoPorTarefa.find(tarefa =>
        tarefa.numeroTarefa === tarefaParam
      );

      if (tarefa) {

        const listaArtefatoTarefa = tarefa.listaArtefato

        // Filtra os projetos que estão na lista de artefatos que contem a tarefa do loop
        const listaProjeto = listaArtefatoTarefa.reduce((listaRetorno, artefato) => {
          listaRetorno.add(artefato.nomeProjeto)
          return listaRetorno
        }, new Set())

        // Filtra as extensões que estão na lista de artefatos que contem a tarefa do loop
        const listaTipoArtefato = listaArtefatoTarefa.reduce((listaRetorno, artefato) => {
          listaRetorno.add(artefato.tipoArtefato.tipo)
          return listaRetorno
        }, new Set())

        for (const nomeProjeto of listaProjeto) {

          const listaArtefatoPorProjeto = listaArtefatoTarefa
            .filter((artefatoFilterProjeto) =>
              artefatoFilterProjeto.nomeProjeto === nomeProjeto
            )

          for (const tipoAlteracao of Object.values(TIPO_MODIFICACAO)) {

            for (const tipo of listaTipoArtefato) {

              const listaSaida = obterListaSaida(tipo, tarefaParam,
                tipoAlteracao, listaArtefatoPorProjeto)

              accumListaSaida.push.apply(accumListaSaida, listaSaida)
            }
          }
        }
      }

      return accumListaSaida

    }, [])
  }

  function obterListaSaida(tipo, tarefaParam, tipoAlteracao, listaArtefatoPorProjeto) {

    const listaRetorno = []

    if (tipo !== TIPO_ARTEFATO.OUTROS) {

      const listaAgrupamento = listaArtefatoPorProjeto.filter((artefato) =>
        artefato.tipoArtefato.tipo === tipo &&
        artefato.tipoArtefato.tipo !== TIPO_ARTEFATO.OUTROS
      )

      listaRetorno.push(obterSaida(
        tarefaParam, tipoAlteracao, listaAgrupamento))

    } else {

      // Filtra as extensões que estão na lista de artefatos
      const listaExtensao = listaArtefatoPorProjeto.reduce((listaRetorno, artefato) => {
        listaRetorno.add(artefato.tipoArtefato.extensao)
        return listaRetorno
      }, new Set())

      for (const extensao of listaExtensao) {

        const listaArtefatoPorExtensao = listaArtefatoPorProjeto
          .filter((artefato) => artefato.tipoArtefato.extensao === extensao &&
            artefato.tipoArtefato.tipo === TIPO_ARTEFATO.OUTROS)

        listaRetorno.push(obterSaida(
          tarefaParam, tipoAlteracao, listaArtefatoPorExtensao))
      }
    }

    return listaRetorno.filter(saida => saida.listaArtefatoSaida.length)
  }

  function obterSaida(tarefaParam, tipoAlteracao, listaAgrupamento) {

    const saida = new SaidaVO()

    saida.numTarefaSaida = tarefaParam
    saida.listaArtefatoSaida = listaAgrupamento.reduce((listaRetorno, artefato) => {

      const artf = new Artefato({
        nomeArtefato: artefato.nomeArtefato,
        tipoArtefato: artefato.tipoArtefato,
        tipoAlteracao: artefato.tipoAlteracao,
        numeroAlteracao: artefato.numeroAlteracao
      })

      if (artefato.isTipoAlteracaoRenomear()) {
        artf.nomeNovoArtefato = artefato.nomeNovoArtefato
        artf.nomeAntigoArtefato = artefato.nomeAntigoArtefato
      }

      listaRetorno.push(artf)

      return listaRetorno
    }, [])

    return saida
  }

  function removerArtefatoDeletado(listaArtefatoAgrupadoPorTarefa) {

    return listaArtefatoAgrupadoPorTarefa.reduce((listaRetorno, tarefa) => {

      tarefa.listaArtefato = tarefa.listaArtefato.filter(artefato => {
        return !artefato.isTipoAlteracaoDelecao()
      })

      if (tarefa.listaArtefato.length) {
        listaRetorno.push(tarefa)
      }

      return listaRetorno
    }, [])
  }

  // function obterListaSaidaTarefa(listaTarefa) {

  //   return listaTarefa.map(tarefa => {

  //     let saida = {}

  //     saida.numTarefaSaida = tarefa.numeroTarefa
  //     saida.listaArtefatoSaida = tarefa.listaArtefato.map(artefato => {
  //       return {
  //         nomeArtefato: artefato.nomeArtefato,
  //         nomeAntigoArtefato: artefato.nomeAntigoArtefato,
  //         nomeNovoArtefato: artefato.nomeNovoArtefato,
  //         tipoArtefato: artefato.tipoArtefato,
  //         tipoAlteracao: artefato.tipoAlteracao,
  //         numeroAlteracao: artefato.numeroAlteracao
  //       }
  //     })

  //     return saida
  //   })
  // }

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
        tipoArtefato: obterTipoArtefato(arquivoReduce.nomeArquivo),
        nomeProjeto: arquivoReduce.nomeProjeto,
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
            artefato.isTipoAlteracaoModificacao()
          )

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

    const filename = path.basename(nomeArtefato)
    const extensao = geradorUtil.obterExtensaoArquivo(nomeArtefato)

    const tipo = Object.values(TIPO_ARTEFATO).find((listaRegex) =>
      listaRegex.some((item) => filename.match(item.regex))
    )

    return {
      extensao: extensao,
      tipo: tipo
    }
  }
}