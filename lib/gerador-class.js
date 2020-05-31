const util = require('util')
const path = require('path')
const exec = util.promisify(require('child_process').exec)
const fs = require('fs-extra')

const Comando = require('../models/comando-git')
const Arquivo = require('../models/arquivo')

module.exports = class Gerador {

  constructor(params) {
    this.params = params
  }

  async init() {

    try {

      const listaPromiseComandoGit = await this.obterListaPromiseComandoGit()

      this.listaArquivo = await this.executarListaPromiseComandoGit(listaPromiseComandoGit)

      this.listaArquivo = this.tratarArquivoRenomeado(this.listaArquivo)
      this.listaArquivo = this.tratarArquivoDeletado(this.listaArquivo)
      this.listaArquivo = this.tratarArquivoAdicionado(this.listaArquivo)

    } catch (error) {
      throw new Error(error.message)
    }
  }

  async obterListaPromiseComandoGit() {

    return this.params.listaProjeto.reduce((accum, caminhoProjeto) => {

      if (fs.existsSync(caminhoProjeto)) {

        accum.push(exec(Comando(caminhoProjeto, this.params.autor, this.params.listaTarefa,
          this.params.mostrarCommitsLocais)))

      } else {
        throw new Error(`Projeto ${caminhoProjeto} não encontrado`)
      }

      return accum
    }, [])
  }

  async executarListaPromiseComandoGit(listaPromiseComandoGit) {

    let listaCommitArquivo = []

    await Promise.all(listaPromiseComandoGit).then(listaRetornoComandoGit => {

      for (const index in listaRetornoComandoGit) {

        if (listaRetornoComandoGit[index].stdout) {

          const nomeProjeto = path.basename(this.params.listaProjeto[index])
          const lista = this.obterListaCommitArquivo(
            listaRetornoComandoGit[index].stdout, nomeProjeto)

          listaCommitArquivo.push.apply(listaCommitArquivo, lista)
        }
      }
    })

    return listaCommitArquivo
  }

  tratarArquivoRenomeado(listaArquivo) {

    return listaArquivo.reduce((listaArquivoSaida, arquivoReduce, index) => {

      if (arquivoReduce.commit.isTipoAlteracaoRenomear()) {

        listaArquivoSaida.slice(0, index + 1)
          .filter(arquivo =>
            arquivo.nomeArquivo === arquivoReduce.nomeArquivo)
          .forEach(arquivo =>
            arquivo.nomeArquivo = arquivoReduce.commit.nomeNovoArquivo)
      }

      return listaArquivoSaida
    }, listaArquivo)
  }

  tratarArquivoDeletado(listaArquivo) {

    let listaArquivoDeletado = listaArquivo.filter(
      arquivoFilter => arquivoFilter.commit.isTipoAlteracaoDelecao())

    return listaArquivoDeletado.reduce((listaArquivoSaida, arquivoDeletado) => {

      const index = listaArquivo.findIndex(arquivo =>
        arquivo.nomeArquivo === arquivoDeletado.nomeArquivo &&
        arquivo.commit.tipoAlteracao === arquivoDeletado.commit.tipoAlteracao
      )

      listaArquivoSaida = listaArquivo.filter((arquivoFilter, indexCommitArquivo) =>
        arquivoFilter.nomeArquivo !== arquivoDeletado.nomeArquivo ||
        indexCommitArquivo >= index
      )

      return listaArquivoSaida
    }, listaArquivo)
  }

  tratarArquivoAdicionado(listaArquivo) {

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

  isMostrarRenomeados(params, commit) {
    return params.mostrarRenomeados && commit.isTipoAlteracaoRenomear()
  }

  isMostrarDeletados(params, commit) {
    return params.mostrarDeletados && commit.isTipoAlteracaoDelecao()
  }

  obterListaCommitArquivo(saida, nomeProjeto) {

    const listaSaidaTask = saida.split(/\n{2,}/g)

    return listaSaidaTask.reduce((accum, saidaTask) => {

      const numeroTarefa = saidaTask.match(/[^\r\n]+/g)[0].match(/task.*\d/i)[0].match(/\d+/)[0]
      const listaArquivo = saidaTask.match(/[^\r\n]+/g).slice(1)

      accum.push.apply(accum,
        listaArquivo.map(arquivo => new Arquivo(nomeProjeto, numeroTarefa, arquivo)))

      return accum
    }, [])
  }
}