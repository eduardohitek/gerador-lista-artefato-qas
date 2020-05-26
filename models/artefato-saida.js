const ArtefatoSaida = function ({
    nomeArtefato,
    nomeNovoArtefato,
    nomeAntigoArtefato,
    tipoArtefato,
    tipoAlteracao,
    numeroAlteracao,
}) {
    this.nomeArtefato = nomeArtefato
    this.nomeNovoArtefato = nomeNovoArtefato
    this.nomeAntigoArtefato = nomeAntigoArtefato
    this.tipoAlteracao = tipoAlteracao
    this.tipoArtefato = tipoArtefato
    this.numeroAlteracao = numeroAlteracao

    return this
}

module.exports = ArtefatoSaida