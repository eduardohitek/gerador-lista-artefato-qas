const TIPO_MODIFICACAO = require('./constants').TIPO_MODIFICACAO

module.exports = (params, listaSaida) => {

    return {

        imprimirListaSaida: () => {

            console.log('')

            for (const saida of listaSaida) {

                console.log(`Tarefa nº ${saida.numTarefaSaida}\n`)

                for (const artefato of saida.listaArtefatoSaida)
                    console.log(imprimirSaida(artefato))

                console.log('')
            }
        }
    }

    function imprimirSaida(artefato) {

        let retorno = artefato.tipoAlteracao + '\t'

        params.mostrarNumModificacao && (
            retorno = retorno.concat(artefato.numeroAlteracao + '\t'))

        if (artefato.tipoAlteracao === TIPO_MODIFICACAO.RENAMED) {

            retorno = retorno.concat(artefato.nomeArtefato + '\t' + artefato.nomeAntigoArtefato + '\t'
                + artefato.nomeNovoArtefato)
        } else {

            retorno = retorno.concat(artefato.nomeArtefato)
        }

        return retorno
    }
}