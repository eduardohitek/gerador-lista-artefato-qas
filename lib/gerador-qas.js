const path = require('path')

const TarefaFoo = require('../models/tarefa-foo')

const Artefato = require('../models/artefato')
const ArtefatoSaida = require('../models/artefato-saida')

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

        const listaArtefatoComTarefaMesmoTipoAlteracao = obterListaArtefatoComTarefaMesmoTipoAlteracao(listaTarefaAgrupadaPorArtefato)
        const listaArtefatoSemTarefaMesmoTipoAlteracao = obterListaArtefatoSemTarefaMesmoTipoAlteracao(listaTarefaAgrupadaPorArtefato)

        const listaSaidaTarefasUmArtefato =
          obterListaSaidaTarefasUmArtefato(listaArtefatoComTarefaMesmoTipoAlteracao)
        const listaSaidaArtefatosUmaTarefa =
          obterListaSaidaArtefatosUmaTarefa(listaArtefatoSemTarefaMesmoTipoAlteracao)

        const retorno = listaSaidaTarefasUmArtefato.concat(listaSaidaArtefatosUmaTarefa)

        return retorno

      } catch (error) {
        throw new Error(error.message)
      }
    }
  }

  function obterListaSaidaTarefasUmArtefato(listaArtefatoComTarefaMesmoTipoAlteracao) {

    return listaArtefatoComTarefaMesmoTipoAlteracao.reduce((listaRetorno, artefato) => {

      obterListaArtefatoSemTarefaRenomear(artefato, listaRetorno)

      if (params.mostrarRenomeados) {
        obterListaArtefatoComTarefaRenomear(artefato, listaRetorno)
      }

      return listaRetorno
    }, [])
  }

  function obterListaArtefatoSemTarefaRenomear(artefato, listaRetorno) {

    const listaTarefaNaoRenomear = artefato.listaTarefa.filter(tarefa => {
      return !tarefa.isTipoAlteracaoRenomear()
    })

    if (listaTarefaNaoRenomear.length) {

      let saida = new SaidaVO()
      let totalModificacao = 0
      let tipoAlteracao = ''

      saida.listaNumTarefaSaida = listaTarefaNaoRenomear.map((tarefa) => {
        totalModificacao += tarefa.numeroAlteracao
        tipoAlteracao = tarefa.tipoAlteracao
        return tarefa.numeroTarefa
      })

      const artefatoSaida = new ArtefatoSaida({
        nomeArtefato: artefato.nomeArtefato,
        tipoAlteracao: tipoAlteracao,
        numeroAlteracao: totalModificacao
      })

      saida.listaArtefatoSaida.push(artefatoSaida)
      listaRetorno.push(saida)
    }
  }

  function obterListaArtefatoComTarefaRenomear(artefato, listaRetorno) {

    const listaTarefaRenomear = artefato.listaTarefa.filter(tarefa => {
      return tarefa.isTipoAlteracaoRenomear()
    })

    if (listaTarefaRenomear.length) {

      const lista = listaTarefaRenomear.reduce((listaFoo, tarefa) => {

        const artefatoSaida = new ArtefatoSaida({
          nomeArtefato: artefato.nomeArtefato,
          nomeNovoArtefato: tarefa.nomeNovoArquivo,
          nomeAntigoArtefato: tarefa.nomeAntigoArquivo,
          tipoAlteracao: tarefa.tipoAlteracao,
          numeroAlteracao: tarefa.numeroAlteracao
        })

        const saidaEncontrada = listaFoo.find(saida =>
          saida.listaNumTarefaSaida.some(numeroTarefa =>
            tarefa.numeroTarefa === numeroTarefa))

        if (!saidaEncontrada) {

          const saida = new SaidaVO()
          saida.listaNumTarefaSaida = [tarefa.numeroTarefa]
          saida.listaArtefatoSaida.push(artefatoSaida)
          listaFoo.push(saida)

        } else {

          saidaEncontrada.listaArtefatoSaida.push(artefatoSaida)
        }

        return listaFoo
      }, [])

      listaRetorno.push.apply(listaRetorno, lista)
    }
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

        const artf = new ArtefatoSaida({
          nomeArtefato: artefato.nomeArtefato,
          tipoArtefato: artefato.tipoArtefato,
          tipoAlteracao: tarefa.tipoAlteracao,
          numeroAlteracao: tarefa.numeroAlteracao,
          nomeAntigoArtefato: tarefa.nomeAntigoArquivo,
          nomeNovoArtefato: tarefa.nomeNovoArquivo
        })

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
  Obtem lista artefatos com tarefas com o mesmo tipo de modificação. 
   
  ex. 
  ---
  Tarefas nº 1189666, 1176490
   
  M	2 foo-estatico/src/lista-foo.tpl.html
  ---
   
  No exemplo, o artefato lista-foo.tpl.html possui 2 tarefas diferentes (1189666 e 1176490)
  com o mesmo tipo de modificação ('M' - Modified)
  */
  function obterListaArtefatoComTarefaMesmoTipoAlteracao(listaArtefato) {

    let listaArtefatoTarefaMesmoTipo = []

    for (const artefato of listaArtefato) {

      if (artefato.listaTarefa.length > 1) {

        // TODO - refatorar
        const listaTarefasMesmoTipo = artefato.listaTarefa
          .filter((tarefaAtual, indexAtual) => {

            const listaSemTarefaAtual = artefato.listaTarefa
              .filter((tarefaFilter, index) => index !== indexAtual)

            // Existe alguma outra tarefa com o mesmo tipo da atual?
            const retorno = listaSemTarefaAtual.some(tarefaSome =>
              tarefaAtual.tipoAlteracao === tarefaSome.tipoAlteracao
            )

            return retorno
          })

        if (listaTarefasMesmoTipo.length) {

          listaArtefatoTarefaMesmoTipo.push(
            new Artefato({
              nomeArtefato: artefato.nomeArtefato,
              listaTarefa: listaTarefasMesmoTipo
            }))
        }
      }
    }

    return listaArtefatoTarefaMesmoTipo
  }

  /*
  Obtem lista de artefatos sem tarefas com o mesmo tipo de modificação. 
   
  ex. 
  ---
  Tarefas nº 1189777
   
  M	1 foo-estatico/src/lista-bar.tpl.html
  A	1 foo-estatico/src/lista-bar.tpl.html
  ---
   
  No exemplo, o artefato lista-bar.tpl.html possui tarefas únicas 
  em relação ao tipo de modificação. 'A' (Added) logicamente só aparece uma vez e
  'M' só aparece se o arquivo tiver sido modificado uma vez

  Artefatos com tarefas com números iguais

  */
  function obterListaArtefatoSemTarefaMesmoTipoAlteracao(listaArtefato) {

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

    return listaArquivo.reduce((accum, arquivoReduce, index, array) => {

      const novaTarefa = new TarefaFoo({
        numeroTarefa: arquivoReduce.commit.numeroTarefa,
        tipoAlteracao: arquivoReduce.commit.tipoAlteracao,
        nomeAntigoArquivo: arquivoReduce.commit.nomeAntigoArquivo,
        nomeNovoArquivo: arquivoReduce.commit.nomeNovoArquivo
      })

      const novoArtefato = new Artefato({
        nomeArtefato: arquivoReduce.nomeArquivo,
        tipoArtefato: obterTipoArtefato(arquivoReduce.nomeArquivo),
        nomeProjeto: arquivoReduce.nomeProjeto,
        listaTarefa: [novaTarefa]
      })

      if (accum.length === 0) {

        accum = [novoArtefato]

      } else if (accum.length > 0) {

        let artefatoEncontrado = accum.find(artefato =>
          artefato.nomeArtefato === arquivoReduce.nomeArquivo)

        if (artefatoEncontrado) {

          // Somente sera incrementado o numero de alteracoes se for MODIFIED
          let tarefaEncontrada = artefatoEncontrado.listaTarefa.find(tarefa =>
            tarefa.numeroTarefa === arquivoReduce.commit.numeroTarefa &&
            tarefa.tipoAlteracao === TIPO_MODIFICACAO.MODIFIED
          )

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
