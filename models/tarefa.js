const TIPO_MODIFICACAO = require('../lib/constants').TIPO_MODIFICACAO

const Tarefa = function ({
    numeroTarefa,
    tipoAlteracao,
    listaArtefato,
    nomeAntigoArquivo,
    nomeNovoArquivo
}) {
    this.numeroTarefa = numeroTarefa
    this.tipoAlteracao = tipoAlteracao
    this.listaArtefato = listaArtefato

    this.nomeAntigoArquivo = nomeAntigoArquivo
    this.nomeNovoArquivo = nomeNovoArquivo

    this.numeroAlteracao = 1

    this.isTipoAlteracaoModificacao = () => this.tipoAlteracao === TIPO_MODIFICACAO.MODIFIED
    this.isTipoAlteracaoDelecao = () => this.tipoAlteracao === TIPO_MODIFICACAO.DELETED
    this.isTipoAlteracaoRenomear = () => this.tipoAlteracao === TIPO_MODIFICACAO.RENAMED

    return this
}

module.exports = Tarefa