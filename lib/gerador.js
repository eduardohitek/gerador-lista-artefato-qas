const util = require('util')
const path = require('path')
const exec = util.promisify(require('child_process').exec)
const fs = require('fs-extra')

const Comando = require('../models/comando-git')
const Arquivo = require('../models/arquivo')

module.exports = (params) => {

  return {

    obterListaPromiseComandoGit: async function () {

      return params.listaProjeto.reduce((accum, caminhoProjeto) => {
  
        if (fs.existsSync(caminhoProjeto)) {
  
          accum.push(exec(Comando(caminhoProjeto, params.autor, params.listaTarefa,
            params.mostrarCommitsLocais)))
  
        } else {
          throw new Error(`Projeto ${caminhoProjeto} não encontrado`)
        }
  
        return accum
      }, [])
    },
  
    executarListaPromiseComandoGit: async function (listaPromiseComandoGit) {
  
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
    },
  
    tratarArquivoRenomeado: function (listaArquivo) {
  
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
    },
  
    tratarArquivoDeletado: function (listaArquivo) {
  
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
    },
  
    tratarArquivoAdicionado: function (listaArquivo) {
  
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
  }
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