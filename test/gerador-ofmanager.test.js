const Param = require('../models/param')
const GeradorTestUtil = require('./gerador-test-util')

const TIPO_MODIFICACAO = require('../lib/constants').TIPO_MODIFICACAO

const autor = 'fulano';

let gitUtil, gerador = {}

describe('test gerais', () => {

    beforeEach(async () => {

        gerador = require('../lib/gerador-ofmanager')
        gitUtil = await new GeradorTestUtil('', autor)
        gitUtil.removerDiretorioTest()
    })

    // node app --diretorio=/tmp/gerador-lista-artefato-qas --projeto=foo --autor=fulano --task=1111111,2222222 --mostrar-num-modificacao --mostrar-deletados --mostrar-commits-locais --mostrar-renomeados
    it('teste foo', async () => {

        const nomeProjetoFoo = 'foo'

        const gitFoo = await new GeradorTestUtil(nomeProjetoFoo, autor)

        await gitFoo.manipularArquivoComCommit('1111111', 'src/app/spas/foo-controller.js', TIPO_MODIFICACAO.ADDED)
        await gitFoo.manipularArquivoComCommit('1111111', 'src/app/spas/foo-controller.js', TIPO_MODIFICACAO.MODIFIED)

        await gitFoo.manipularArquivoComCommit('1111111', 
            { origem: 'src/app/spas/foo-controller.js', destino: 'src/app/spas/bar-controller.js' }, TIPO_MODIFICACAO.RENAMED)

        const params = new Param({
            autor: "fulano",
            listaProjeto: [
                gitFoo.obterCaminhoProjeto()
            ],
            listaTarefa: ["1111111", "2222222"],
            mostrarNumModificacao: true,
            mostrarCommitsLocais: true,
            mostrarDeletados: true,
            mostrarRenomeados: true
        })

        const listaSaida = await gerador(params).gerarListaArtefato()
        const printer = require('../lib/printer')(params, listaSaida)

        printer.imprimirListaSaida(listaSaida)
    })

    // node app --diretorio=/tmp/gerador-lista-artefato-qas --projeto=foo,bar --autor=fulano --task=1111111,2222222 --mostrar-num-modificacao --mostrar-deletados --mostrar-commits-locais --mostrar-renomeados
    xit('teste foo', async () => {

        const nomeProjetoFoo = 'foo'
        const nomeProjetoBar = 'bar'

        const gitFoo = await new GeradorTestUtil(nomeProjetoFoo, autor)
        const gitBar = await new GeradorTestUtil(nomeProjetoBar, autor)

        await gitFoo.manipularArquivoComCommit('1111111', 'src/app/spas/foo-controller.js', TIPO_MODIFICACAO.ADDED)
        await gitFoo.manipularArquivoComCommit('1111111', 'src/app/spas/bar-controller.js', TIPO_MODIFICACAO.ADDED)
        await gitFoo.manipularArquivoComCommit('2222222', 'src/app/spas/bar-controller.js', TIPO_MODIFICACAO.MODIFIED)

        await gitBar.manipularArquivoComCommit('1111111', 'src/app/spas/zaz-controller.js', TIPO_MODIFICACAO.ADDED)
        await gitBar.manipularArquivoComCommit('1111111', 'src/app/spas/zoz-controller.js', TIPO_MODIFICACAO.ADDED)
        await gitBar.manipularArquivoComCommit('2222222', 'src/app/spas/zoz-controller.js', TIPO_MODIFICACAO.MODIFIED)
        await gitBar.manipularArquivoComCommit('2222222', 'src/app/spas/zoz-controller.js', TIPO_MODIFICACAO.MODIFIED)

        const params = new Param({
            autor: "fulano",
            listaProjeto: [
                gitFoo.obterCaminhoProjeto(),
                gitBar.obterCaminhoProjeto()
            ],
            listaTarefa: ["1111111", "2222222"],
            mostrarNumModificacao: true,
            mostrarCommitsLocais: true,
            mostrarDeletados: true,
            mostrarRenomeados: true
        })

        const listaSaida = await gerador(params).gerarListaArtefato()
        const printer = require('../lib/printer')(params, listaSaida)

        printer.imprimirListaSaida(listaSaida)
    })
})