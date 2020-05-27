const path = require('path')

const Tarefa = require('../models/tarefa')
const Artefato = require('../models/artefato-ofmanager')
const SaidaVO = require('../models/saida-vo-ofmanager')

const TIPO_MODIFICACAO = require('../lib/constants').TIPO_MODIFICACAO
const TIPO_ARTEFATO = require('./constants').TIPO_ARTEFATO

const geradorUtil = require('../util/gerador-util')

let gerador = {}

module.exports = (params) => {

  return {

    gerarListaArtefato: async () => {

      try {
        
        gerador = require('./gerador')(params)

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

    return listaArtefatoAgrupadoPorTarefa.map(tarefa => {

      const saida = new SaidaVO()
      saida.numeroTarefaSaida = tarefa.numeroTarefa

      //  Filtra os projetos que estão na lista de artefatos que contem a tarefa do loop
      const listaProjeto = tarefa.listaArtefato.reduce((listaRetorno, artefato) => {
        listaRetorno.add(artefato.nomeProjeto)
        return listaRetorno
      }, new Set())

      for (const nomeProjeto of listaProjeto) {

        // Filtra as extensões que estão na lista de artefatos que contem a tarefa do loop
        const listaArtefatoPorProjeto = tarefa.listaArtefato.filter(
          artefato => artefato.nomeProjeto === nomeProjeto)

        // Filtra as extensões que estão na lista de artefatos que contem a tarefa do loop
        const listaTipoArtefato = listaArtefatoPorProjeto.reduce((listaRetorno, artefato) => {
          listaRetorno.add(artefato.tipoArtefato.tipo)
          return listaRetorno
        }, new Set())

        // Filtra as extensões que estão na lista de artefatos que contem a tarefa do loop
        const listaTipoAlteracao = listaArtefatoPorProjeto.reduce((listaRetorno, artefato) => {
          listaRetorno.add(artefato.tipoAlteracao)
          return listaRetorno
        }, new Set())

        for (const tipoAlteracao of listaTipoAlteracao) {

          for (const tipo of listaTipoArtefato) {

            const listaSaida = obterListaSaida(tipo, tipoAlteracao, listaArtefatoPorProjeto)

            saida.listaArtefatoSaida
              .push.apply(saida.listaArtefatoSaida, listaSaida)
          }
        }
      }

      return saida
    })
  }

  function obterListaSaida(tipo, tipoAlteracao, listaArtefatoPorProjeto) {

    const listaRetorno = []

    if (tipo !== TIPO_ARTEFATO.OUTROS) {

      const listaAgrupamento = listaArtefatoPorProjeto.filter((artefato) =>
        artefato.tipoAlteracao === tipoAlteracao &&
        artefato.tipoArtefato.tipo === tipo &&
        artefato.tipoArtefato.tipo !== TIPO_ARTEFATO.OUTROS
      )

      listaRetorno.push.apply(listaRetorno, obterSaida(listaAgrupamento))

    } else {

      // Filtra as extensões que estão na lista de artefatos
      const listaExtensao = listaArtefatoPorProjeto.reduce((listaRetorno, artefato) => {
        listaRetorno.add(artefato.tipoArtefato.extensao)
        return listaRetorno
      }, new Set())

      for (const extensao of listaExtensao) {

        const listaArtefatoPorExtensao = listaArtefatoPorProjeto
          .filter((artefato) => artefato.tipoArtefato.extensao === extensao &&
            artefato.tipoAlteracao === tipoAlteracao &&
            artefato.tipoArtefato.tipo === TIPO_ARTEFATO.OUTROS)

        listaRetorno.push.apply(listaRetorno, obterSaida(listaArtefatoPorExtensao))
      }
    }

    return listaRetorno
  }

  function obterSaida(listaAgrupamento) {

    return listaAgrupamento.reduce((listaRetorno, artefato) => {

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
  //     saida.listaArtefatoSaida = tarefa.listaArtefato
  //         .sort(ordenarListaArtefato).map(artefato => {

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

      if (arquivoReduce.commit.isTipoAlteracaoModificacao() ||
        arquivoReduce.commit.isTipoAlteracaoAdicionar() ||
        gerador.isMostrarRenomeados(params, arquivoReduce.commit) ||
        gerador.isMostrarDeletados(params, arquivoReduce.commit)) {

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