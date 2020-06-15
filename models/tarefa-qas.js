const { TIPO_MODIFICACAO } = require('../lib/constants')

const Tarefa = function ({
    numeroTarefa,
    tipoAlteracao,
    nomeAntigoArquivo,
    nomeNovoArquivo
}) {
    this.numeroTarefa = numeroTarefa
    this.tipoAlteracao = tipoAlteracao
    this.nomeAntigoArquivo = nomeAntigoArquivo
    this.nomeNovoArquivo = nomeNovoArquivo

    this.numeroAlteracao = 1

    this.isTipoAlteracaoModificacao = () => this.tipoAlteracao === TIPO_MODIFICACAO.MODIFIED
    this.isTipoAlteracaoDelecao = () => this.tipoAlteracao === TIPO_MODIFICACAO.DELETED
    this.isTipoAlteracaoRenomear = () => this.tipoAlteracao === TIPO_MODIFICACAO.RENAMED

    return this
}

module.exports = Tarefa