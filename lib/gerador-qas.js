const path = require('path')

const Tarefa = require('../models/tarefa')
const Artefato = require('../models/artefato')
const SaidaVO = require('../models/saida-vo')

const geradorUtil = require('../util/gerador-util')

const TIPO_MODIFICACAO = require('./constants').TIPO_MODIFICACAO
const TIPO_ARTEFATO = require('./constants').TIPO_ARTEFATO

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

        let listaTarefaAgrupadaPorArtefato = agruparTarefaPorArtefato(listaArquivo)

        if (!params.mostrarDeletados) {
          listaTarefaAgrupadaPorArtefato = removerArtefatoDeletado(listaTarefaAgrupadaPorArtefato)
        }

        if (!params.mostrarRenomeados) {
          listaTarefaAgrupadaPorArtefato = removerArtefatoRenomeado(listaTarefaAgrupadaPorArtefato)
        }

        const listaArtefatoComTarefaMesmoTipo = filtrarArtefatoComTarefaMesmoTipo(listaTarefaAgrupadaPorArtefato)
        const listaArtefatoSemTarefaMesmoTipo = filtrarArtefatoSemTarefaMesmoTipo(listaTarefaAgrupadaPorArtefato)

        const listaSaidaTarefasUmArtefato =
          obterListaSaidaTarefasUmArtefato(listaArtefatoComTarefaMesmoTipo)
        const listaSaidaArtefatosUmaTarefa =
          obterListaSaidaArtefatosUmaTarefa(listaArtefatoSemTarefaMesmoTipo)

        return listaSaidaTarefasUmArtefato.concat(listaSaidaArtefatosUmaTarefa)

      } catch (error) {
        throw new Error(error.message)
      }
    }
  }

  function obterListaSaidaTarefasUmArtefato(listaArtefatoComTarefaMesmoTipo) {

    return listaArtefatoComTarefaMesmoTipo.map((artefato) => {

      let saida = new SaidaVO()
      let totalModificacao = 0
      let tipoAlteracao = ''

      saida.listaNumTarefaSaida = artefato.listaTarefa.map((tarefa) => {
        totalModificacao += tarefa.numeroAlteracao
        tipoAlteracao = tarefa.tipoAlteracao

        return tarefa.numeroTarefa
      })

      let artefatoSaida = new Artefato({
        nomeArtefato: artefato.nomeArtefato,
        nomeNovoArtefato: artefato.nomeNovoArtefato,
        nomeAntigoArtefato: artefato.nomeAntigoArtefato,
        tipoAlteracao: tipoAlteracao,
        numeroAlteracao: totalModificacao
      })

      if (tipoAlteracao === TIPO_MODIFICACAO.RENAMED) {
        artefatoSaida.nomeNovoArtefato = artefato.nomeNovoArtefato
        artefatoSaida.nomeAntigoArtefato = artefato.nomeAntigoArtefato
      }

      saida.listaArtefatoSaida.push(artefatoSaida)

      return saida
    })
  }

  function obterListaSaidaArtefatosUmaTarefa(listaArtefatoSemTarefaMesmoTipo) {

    return params.listaTarefa.reduce((accumListaSaida, tarefaParam) => {

      // Filtra os artefatos que contem a tarefa do loop
      const listaArtefatoTarefa = listaArtefatoSemTarefaMesmoTipo.filter(artefato =>
        artefato.listaTarefa.some(tarefa =>
          tarefa.numeroTarefa === tarefaParam)
      )

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

      return accumListaSaida

    }, []).sort(ordenarListaSaidaPorQuantidadeArtefato)
  }

  function obterListaSaida(tipo, tarefaParam, tipoAlteracao, listaArtefatoPorProjeto) {

    const listaRetorno = []

    if (tipo !== TIPO_ARTEFATO.OUTROS) {

      const listaAgrupamento = listaArtefatoPorProjeto.filter((artefato) =>
        artefato.tipoArtefato.tipo === tipo &&
        artefato.tipoArtefato.tipo !== TIPO_ARTEFATO.OUTROS
      )

      listaRetorno.push(obterSaida(tarefaParam, tipoAlteracao, listaAgrupamento))

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

    saida.listaNumTarefaSaida.push(tarefaParam)
    saida.listaArtefatoSaida = listaAgrupamento.reduce((listaRetorno, artefato) => {

      const listaTarefa = artefato.listaTarefa.filter(tarefa =>
        tarefa.numeroTarefa === tarefaParam &&
        tarefa.tipoAlteracao === tipoAlteracao)

      for (const tarefa of listaTarefa) {

        const artf = new Artefato({
          nomeArtefato: artefato.nomeArtefato,
          tipoArtefato: artefato.tipoArtefato,
          tipoAlteracao: tarefa.tipoAlteracao,
          numeroAlteracao: tarefa.numeroAlteracao
        })

        if (tarefa.isTipoAlteracaoRenomear()) {
          artf.nomeNovoArtefato = artefato.nomeNovoArtefato
          artf.nomeAntigoArtefato = artefato.nomeAntigoArtefato
        }

        listaRetorno.push(artf)
      }

      return listaRetorno
    }, [])

    return saida
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

  /*
  Filtra artefatos com tarefas com o mesmo tipo de modificação. 
   
  ex. 
  ---
  Tarefas nº 1189666, 1176490
   
  M	2 foo-estatico/src/lista-foo.tpl.html
  ---
   
  No exemplo, o artefato lista-foo.tpl.html possui 2 tarefas (1189666 e 1176490)
  com o mesmo tipo de modificação ('M' - Modified)
  */
  function filtrarArtefatoComTarefaMesmoTipo(listaArtefato) {

    let listaArtefatoTarefaMesmoTipo = []

    for (const artefato of listaArtefato) {

      if (artefato.listaTarefa.length > 1) {

        // TODO - refatorar
        const listaTarefaMesmoTipo = artefato.listaTarefa
          .filter((tarefaAtual, indexAtual) => {

            const listaSemTarefaAtual = artefato.listaTarefa
              .filter((tarefaFilter, index) => index !== indexAtual)

            // Existe alguma outra tarefa com o mesmo tipo da atual?
            const retorno = listaSemTarefaAtual.some(tarefaSome =>
              tarefaAtual.tipoAlteracao === tarefaSome.tipoAlteracao
            )

            return retorno
          })

        if (listaTarefaMesmoTipo.length) {

          listaArtefatoTarefaMesmoTipo.push(
            new Artefato({
              nomeArtefato: artefato.nomeArtefato,
              listaTarefa: listaTarefaMesmoTipo
            }))
        }
      }
    }

    return listaArtefatoTarefaMesmoTipo
  }

  /*
  Filtra artefatos sem tarefas com o mesmo tipo de modificação. 
   
  ex. 
  ---
  Tarefas nº 1189777
   
  M	1 foo-estatico/src/lista-bar.tpl.html
  A	1 foo-estatico/src/lista-bar.tpl.html
  ---
   
  No exemplo, o artefato lista-bar.tpl.html possui tarefas únicas 
  em relação ao tipo de modificação. 'A' (Added) logicamente só aparece uma vez e
  'M' só aparece se o arquivo tiver sido modificado uma vez
  */
  function filtrarArtefatoSemTarefaMesmoTipo(listaArtefato) {

    let listaArtefatoUmTipoModificacao = []

    for (const artefato of listaArtefato) {

      if (artefato.listaTarefa.length === 1) {

        listaArtefatoUmTipoModificacao.push(artefato)

      } else if (artefato.listaTarefa.length > 1) {

        // TODO - refatorar
        const listaTarefaUnicoTipoAlteracao = artefato.listaTarefa
          .filter((tarefaAtual, indexAtual) => {

            const listaSemTarefaAtual = artefato.listaTarefa
              .filter((tarefaFilter, index) => index !== indexAtual)

            // Existe alguma outra tarefa com o mesmo tipo da atual?
            const retorno = listaSemTarefaAtual.some(
              tarefaSome => tarefaAtual.tipoAlteracao === tarefaSome.tipoAlteracao)

            return !retorno
          })

        if (listaTarefaUnicoTipoAlteracao.length) {

          listaArtefatoUmTipoModificacao.push(
            new Artefato({
              nomeArtefato: artefato.nomeArtefato,
              nomeNovoArtefato: artefato.nomeNovoArtefato,
              nomeAntigoArtefato: artefato.nomeAntigoArtefato,
              tipoArtefato: artefato.tipoArtefato,
              nomeProjeto: artefato.nomeProjeto,
              listaTarefa: listaTarefaUnicoTipoAlteracao
            }))
        }
      }
    }

    return listaArtefatoUmTipoModificacao
  }

  function agruparTarefaPorArtefato(listaArquivo) {

    return listaArquivo.reduce((accum, arquivoReduce) => {

      const novaTarefa = new Tarefa({
        numeroTarefa: arquivoReduce.commit.numeroTarefa,
        tipoAlteracao: arquivoReduce.commit.tipoAlteracao
      })

      const novoArtefato = new Artefato({
        nomeArtefato: arquivoReduce.nomeArquivo,
        nomeNovoArtefato: arquivoReduce.commit.nomeNovoArquivo,
        nomeAntigoArtefato: arquivoReduce.commit.nomeAntigoArquivo,
        tipoArtefato: obterTipoArtefato(arquivoReduce.nomeArquivo),
        nomeProjeto: arquivoReduce.nomeProjeto,
        listaTarefa: [novaTarefa]
      })

      if (accum.length === 0) {

        accum = [novoArtefato]

      } else if (accum.length > 0) {

        let artefatoEncontrado = accum.find(artefato =>
          artefato.nomeArtefato === arquivoReduce.nomeArquivo &&
            artefato.tipoAlteracao === TIPO_MODIFICACAO.MODIFIED)

        if (artefatoEncontrado) {

          let tarefaEncontrada = artefatoEncontrado.listaTarefa.find(tarefa =>
            tarefa.numeroTarefa === arquivoReduce.commit.numeroTarefa &&
            tarefa.tipoAlteracao === arquivoReduce.commit.tipoAlteracao
          )

          if (arquivoReduce.commit.isTipoAlteracaoRenomear()) {

            if (!artefatoEncontrado.nomeAntigoArtefato)
              artefatoEncontrado.nomeAntigoArtefato = arquivoReduce.commit.nomeAntigoArquivo

            artefatoEncontrado.nomeNovoArtefato = arquivoReduce.commit.nomeNovoArquivo
          }

          if (tarefaEncontrada)
            tarefaEncontrada.numeroAlteracao += 1
          else
            artefatoEncontrado.listaTarefa.push(novaTarefa)

        } else {
          accum.push(novoArtefato)
        }
      }

      return accum

    }, []).sort(ordenarListaArtefato)
  }

  function removerArtefatoDeletado(listaTarefaAgrupadaPorArtefato) {

    return listaTarefaAgrupadaPorArtefato.reduce((accum, artefato) => {

      artefato.listaTarefa = artefato.listaTarefa.filter(tarefa => {
        return !tarefa.isTipoAlteracaoDelecao()
      })

      if (artefato.listaTarefa.length) {
        accum.push(artefato)
      }

      return accum
    }, [])
  }

  function removerArtefatoRenomeado(listaTarefaAgrupadaPorArtefato) {

    return listaTarefaAgrupadaPorArtefato.reduce((accum, artefato) => {

      artefato.listaTarefa = artefato.listaTarefa.filter(tarefa => {
        return !tarefa.isTipoAlteracaoRenomear()
      })

      if (artefato.listaTarefa.length) {
        accum.push(artefato)
      }

      return accum
    }, [])
  }

  function ordenarListaArtefato(artefatoA, artefatoB) {
    return artefatoA.nomeProjeto.localeCompare(artefatoB.nomeProjeto) ||
      artefatoA.obterNomeArtefatoReverso().localeCompare(artefatoB.obterNomeArtefatoReverso())
  }

  function ordenarListaSaidaPorQuantidadeArtefato(saidaA, saidaB) {
    return saidaA.listaArtefatoSaida.length - saidaB.listaArtefatoSaida.length
  }
}