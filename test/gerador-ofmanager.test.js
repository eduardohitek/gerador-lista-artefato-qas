const Param = require('../models/param')
const GeradorTestUtil = require('./gerador-test-util')

const TIPO_MODIFICACAO = require('../lib/constants').TIPO_MODIFICACAO

const nomeProjeto = 'foo'
const autor = 'fulano'

let gitUtil, gerador, params = {}

describe('test gerais', () => {

    beforeEach(async () => {

        gerador = require('../lib/gerador-ofmanager')
        gitUtil = await new GeradorTestUtil(nomeProjeto, autor)

        params = new Param({
            autor: "fulano",
            listaProjeto: [
                gitUtil.obterCaminhoProjeto()
            ],
            listaTarefa: ["1111111", "2222222"],
            mostrarNumModificacao: true,
            mostrarCommitsLocais: true,
            mostrarDeletados: true,
            mostrarRenomeados: true
        })
    })

    // node app --diretorio=/tmp/gerador-lista-artefato-qas --projeto=foo --autor=fulano --task=1111111,2222222 --mostrar-num-modificacao --mostrar-deletados --mostrar-commits-locais --mostrar-renomeados
    it('teste foo', async () => {

        const nomeProjetoFoo = 'foo'

        const gitFoo = await new GeradorTestUtil(nomeProjetoFoo, autor)

        const params = new Param({
            autor: "fulano",
            listaProjeto: [
                gitFoo.obterCaminhoProjeto()
            ],
            listaTarefa: ["1111111,2222222"],
            mostrarNumModificacao: true,
            mostrarCommitsLocais: true,
            mostrarDeletados: true,
            mostrarRenomeados: true
        })

        await gitFoo.manipularArquivoComCommit('1111111', 'src/app/spas/foo-controller.js', TIPO_MODIFICACAO.ADDED)
        await gitFoo.manipularArquivoComCommit('1111111', 'src/app/spas/bar-controller.js', TIPO_MODIFICACAO.ADDED)

        await gitFoo.manipularArquivoComCommit('2222222', 'src/app/spas/bar-controller.js', TIPO_MODIFICACAO.MODIFIED)

        const lista = await gerador(params).gerarListaArtefato()

        // gitFoo.removerDiretorioProjeto()
    })

    // node app --diretorio=/tmp/gerador-lista-artefato-qas --projeto=foo,bar --autor=fulano --task=1111111,2222222 --mostrar-num-modificacao --mostrar-deletados --mostrar-commits-locais --mostrar-renomeados
    // it('teste foo', async () => {

    //     const nomeProjetoFoo = 'foo'
    //     const nomeProjetoBar = 'bar'

    //     const gitFoo = await new GeradorTestUtil(nomeProjetoFoo, autor)
    //     const gitBar = await new GeradorTestUtil(nomeProjetoBar, autor)

    //     const params = new Param({
    //         autor: "fulano",
    //         listaProjeto: [
    //             gitFoo.obterCaminhoProjeto(),
    //             gitBar.obterCaminhoProjeto(),
    //         ],
    //         listaTarefa: ["1111111", "2222222"],
    //         mostrarNumModificacao: true,
    //         mostrarCommitsLocais: true,
    //         mostrarDeletados: true,
    //         mostrarRenomeados: true
    //     })

    //     await gitFoo.manipularListaArquivoComCommit('1111111', [
    //         { tipoAlteracao: TIPO_MODIFICACAO.ADDED, pathArquivo: 'src/main/java/br/com/foo/bar/api/v1/resource/BazResource.java' },
    //         { tipoAlteracao: TIPO_MODIFICACAO.ADDED, pathArquivo: 'src/test/java/br/com/foo/bar/api/v1/resources/test/BazResourceTest.java' }
    //     ])

    //     await gitFoo.manipularListaArquivoComCommit('1111111', [
    //         { tipoAlteracao: TIPO_MODIFICACAO.ADDED, pathArquivo: 'src/main/java/br/com/foo/bar/api/v1/resource/GatewayBar.java' },
    //         { tipoAlteracao: TIPO_MODIFICACAO.ADDED, pathArquivo: 'src/test/java/br/com/foo/bar/api/v1/resources/test/GatewayBarTest.java' }
    //     ])

    //     await gitFoo.manipularArquivoComCommit('1111111', 'karma.conf.js', TIPO_MODIFICACAO.ADDED)
    //     await gitFoo.manipularArquivoComCommit('1111111', 'Gruntfile.js', TIPO_MODIFICACAO.ADDED)

    //     // Projeto diferentes
    //     await gitFoo.manipularArquivoComCommit('1111111', 'src/app/spas/foo-controller.js', TIPO_MODIFICACAO.ADDED)
    //     await gitBar.manipularArquivoComCommit('1111111', 'src/app/spas/bar-controller.js', TIPO_MODIFICACAO.ADDED)

    //     // Adicionado e deletado
    //     await gitFoo.manipularArquivoComCommit('1111111', 'bar-controller.html', TIPO_MODIFICACAO.ADDED)
    //     await gitFoo.manipularArquivoComCommit('1111111', 'bar-controller.html', TIPO_MODIFICACAO.DELETED)

    //     // Sera considerado somente A na tarefa
    //     await gitFoo.manipularArquivoComCommit('1111111', 'foo-controller.html', TIPO_MODIFICACAO.ADDED)
    //     await gitFoo.manipularArquivoComCommit('1111111', 'foo-controller.html', TIPO_MODIFICACAO.MODIFIED)
    //     await gitFoo.manipularArquivoComCommit('1111111', 'foo-controller.html', TIPO_MODIFICACAO.MODIFIED)

    //     await gitFoo.manipularArquivoComCommit('2222222', 'foo-controller.html', TIPO_MODIFICACAO.MODIFIED)
    //     await gitFoo.manipularArquivoComCommit('2222222', 'foo-controller.html', TIPO_MODIFICACAO.MODIFIED)

    //     await gitBar.manipularArquivoComCommit('2222222', 'qux-controller.html', TIPO_MODIFICACAO.ADDED)

    //     await gitBar.manipularArquivoComCommit('2222222',
    //         { origem: 'qux-controller.html', destino: 'quy-controller.html' }, TIPO_MODIFICACAO.RENAMED)
    //     await gitBar.manipularArquivoComCommit('2222222',
    //         { origem: 'quy-controller.html', destino: 'quuz-controller.html' }, TIPO_MODIFICACAO.RENAMED)

    //     const lista = await gerador(params).gerarListaArtefato()

    //     // gitFoo.removerDiretorioProjeto()
    //     // gitBar.removerDiretorioProjeto()
    // })

    // afterEach(async () => {
    //     gitUtil.removerDiretorioProjeto()
    // })

    // afterAll(async () => {
    //     gitUtil.removerDiretorioTest()
    // })
})