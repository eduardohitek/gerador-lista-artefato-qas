const TIPO_MODIFICACAO = require('../lib/constants').TIPO_MODIFICACAO

const Artefato = function ({
    nomeArtefato,
    nomeNovoArtefato,
    nomeAntigoArtefato,
    extensao,
    tipoArtefato,
    nomeProjeto,
    listaTarefa,
    tipoAlteracao,
    numeroAlteracao,
}) {
    this.nomeArtefato = nomeArtefato
    this.nomeNovoArtefato = nomeNovoArtefato
    this.nomeAntigoArtefato = nomeAntigoArtefato
    this.extensao = extensao
    this.tipoArtefato = tipoArtefato
    this.nomeProjeto = nomeProjeto
    this.listaTarefa = listaTarefa
    this.tipoAlteracao = tipoAlteracao
    this.numeroAlteracao = numeroAlteracao

    this.numeroAlteracao = 1

    this.isTipoAlteracaoModificacao = () => this.tipoAlteracao === TIPO_MODIFICACAO.MODIFIED
    this.isTipoAlteracaoDelecao = () => this.tipoAlteracao === TIPO_MODIFICACAO.DELETED
    this.isTipoAlteracaoRenomear = () => this.tipoAlteracao === TIPO_MODIFICACAO.RENAMED
    
    return this
}

module.exports = Artefato