const ArtefatoSaida = function ({
    nomeArtefato,
    nomeNovoArtefato,
    nomeAntigoArtefato,
    tipoAlteracao,
    numeroAlteracao,
}) {
    this.nomeArtefato = nomeArtefato
    this.nomeNovoArtefato = nomeNovoArtefato
    this.nomeAntigoArtefato = nomeAntigoArtefato
    this.tipoAlteracao = tipoAlteracao
    this.numeroAlteracao = numeroAlteracao

    return this
}

module.exports = ArtefatoSaida