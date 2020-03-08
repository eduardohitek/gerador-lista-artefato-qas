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

    // node app --diretorio=/tmp/gerador-lista-artefato-qas --projeto=foo,bar --autor=fulano --task=1111111,2222222 --mostrar-num-modificacao --mostrar-deletados --mostrar-commits-locais --mostrar-renomeados
    it('teste de listagem com arquivos com tipos diferentes separados', async () => {

        const nomeProjetoFoo = 'foo'
        const nomeProjetoBar = 'bar'

        const gitFoo = await new GeradorTestUtil(nomeProjetoFoo, autor)
        const gitBar = await new GeradorTestUtil(nomeProjetoBar, autor)

        const params = new Param({
            autor: "fulano",
            listaProjeto: [
                gitFoo.obterCaminhoProjeto(),
                gitBar.obterCaminhoProjeto(),
            ],
            listaTarefa: ["1111111", "2222222"],
            mostrarNumModificacao: true,
            mostrarCommitsLocais: true,
            mostrarDeletados: true,
            mostrarRenomeados: true
        })

        await gitFoo.manipularListaArquivoComCommit('1111111', [
            { tipoAlteracao: TIPO_MODIFICACAO.ADDED, pathArquivo: 'src/main/java/br/com/foo/bar/api/v1/resource/BazResource.java' },
            { tipoAlteracao: TIPO_MODIFICACAO.ADDED, pathArquivo: 'src/test/java/br/com/foo/bar/api/v1/resources/test/BazResourceTest.java' }
        ])

        await gitFoo.manipularListaArquivoComCommit('1111111', [
            { tipoAlteracao: TIPO_MODIFICACAO.ADDED, pathArquivo: 'src/main/java/br/com/foo/bar/api/v1/resource/GatewayBar.java' },
            { tipoAlteracao: TIPO_MODIFICACAO.ADDED, pathArquivo: 'src/test/java/br/com/foo/bar/api/v1/resources/test/GatewayBarTest.java' }
        ])

        await gitFoo.manipularArquivoComCommit('1111111', 'karma.conf.js', TIPO_MODIFICACAO.ADDED)
        await gitFoo.manipularArquivoComCommit('1111111', 'Gruntfile.js', TIPO_MODIFICACAO.ADDED)

        // Projeto diferentes
        await gitFoo.manipularArquivoComCommit('1111111', 'src/app/spas/foo-controller.js', TIPO_MODIFICACAO.ADDED)
        await gitBar.manipularArquivoComCommit('1111111', 'src/app/spas/bar-controller.js', TIPO_MODIFICACAO.ADDED)

        // Adicionado e deletado
        await gitFoo.manipularArquivoComCommit('1111111', 'bar-controller.html', TIPO_MODIFICACAO.ADDED)
        await gitFoo.manipularArquivoComCommit('1111111', 'bar-controller.html', TIPO_MODIFICACAO.DELETED)

        // Sera considerado somente A na tarefa
        await gitFoo.manipularArquivoComCommit('1111111', 'foo-controller.html', TIPO_MODIFICACAO.ADDED)
        await gitFoo.manipularArquivoComCommit('1111111', 'foo-controller.html', TIPO_MODIFICACAO.MODIFIED)
        await gitFoo.manipularArquivoComCommit('1111111', 'foo-controller.html', TIPO_MODIFICACAO.MODIFIED)

        await gitFoo.manipularArquivoComCommit('2222222', 'foo-controller.html', TIPO_MODIFICACAO.MODIFIED)
        await gitFoo.manipularArquivoComCommit('2222222', 'foo-controller.html', TIPO_MODIFICACAO.MODIFIED)

        await gitBar.manipularArquivoComCommit('2222222', 'qux-controller.html', TIPO_MODIFICACAO.ADDED)

        await gitBar.manipularArquivoComCommit('2222222',
            { origem: 'qux-controller.html', destino: 'quy-controller.html' }, TIPO_MODIFICACAO.RENAMED)
        await gitBar.manipularArquivoComCommit('2222222',
            { origem: 'quy-controller.html', destino: 'quuz-controller.html' }, TIPO_MODIFICACAO.RENAMED)

        const lista = await gerador(params).gerarListaArtefato()

        expect(lista).toHaveLength(10)

        expect(lista[0].listaNumTarefaSaida).toHaveLength(1)
        expect(lista[0].listaNumTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
        expect(lista[0].listaArtefatoSaida).toHaveLength(1)
        expect(lista[0].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
        expect(lista[0].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
        expect(lista[0].listaArtefatoSaida[0].nomeArtefato).toMatch(/.*bar-controller.js$/g)

        expect(lista[1].listaNumTarefaSaida).toHaveLength(1)
        expect(lista[1].listaNumTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
        expect(lista[1].listaArtefatoSaida).toHaveLength(1)
        expect(lista[1].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
        expect(lista[1].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
        expect(lista[1].listaArtefatoSaida[0].nomeArtefato).toMatch(/.*foo-controller.html$/g)

        expect(lista[2].listaNumTarefaSaida).toHaveLength(1)
        expect(lista[2].listaNumTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
        expect(lista[2].listaArtefatoSaida).toHaveLength(1)
        expect(lista[2].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
        expect(lista[2].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
        expect(lista[2].listaArtefatoSaida[0].nomeArtefato).toMatch(/.*foo-controller.js$/g)

        expect(lista[3].listaNumTarefaSaida).toHaveLength(1)
        expect(lista[3].listaNumTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
        expect(lista[3].listaArtefatoSaida).toHaveLength(1)
        expect(lista[3].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.DELETED)
        expect(lista[3].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
        expect(lista[3].listaArtefatoSaida[0].nomeArtefato).toMatch(/.*bar-controller.html$/g)

        expect(lista[4].listaNumTarefaSaida).toHaveLength(1)
        expect(lista[4].listaNumTarefaSaida).toEqual(expect.arrayContaining(['2222222']))
        expect(lista[4].listaArtefatoSaida).toHaveLength(1)
        expect(lista[4].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
        expect(lista[4].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
        expect(lista[4].listaArtefatoSaida[0].nomeArtefato).toBe('bar/quuz-controller.html')

        expect(lista[5].listaNumTarefaSaida).toHaveLength(1)
        expect(lista[5].listaNumTarefaSaida).toEqual(expect.arrayContaining(['2222222']))
        expect(lista[5].listaArtefatoSaida).toHaveLength(1)
        expect(lista[5].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.RENAMED)
        expect(lista[5].listaArtefatoSaida[0].numeroAlteracao).toBe(2)
        expect(lista[5].listaArtefatoSaida[0].nomeArtefato).toBe('bar/quuz-controller.html')
        expect(lista[5].listaArtefatoSaida[0].nomeAntigoArtefato).toBe('bar/quy-controller.html')
        expect(lista[5].listaArtefatoSaida[0].nomeNovoArtefato).toBe('bar/quuz-controller.html')

        expect(lista[7].listaNumTarefaSaida).toHaveLength(1)
        expect(lista[7].listaNumTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
        expect(lista[7].listaArtefatoSaida).toHaveLength(2)
        expect(lista[7].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
        expect(lista[7].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
        expect(lista[7].listaArtefatoSaida[0].nomeArtefato).toMatch(/.*BazResource.java$/g)
        expect(lista[7].listaArtefatoSaida[1].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
        expect(lista[7].listaArtefatoSaida[1].numeroAlteracao).toBe(1)
        expect(lista[7].listaArtefatoSaida[1].nomeArtefato).toMatch(/.*BazResourceTest.java$/g)

        expect(lista[8].listaNumTarefaSaida).toHaveLength(1)
        expect(lista[8].listaNumTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
        expect(lista[8].listaArtefatoSaida).toHaveLength(2)
        expect(lista[8].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
        expect(lista[8].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
        expect(lista[8].listaArtefatoSaida[0].nomeArtefato).toMatch(/.*GatewayBar.java$/g)
        expect(lista[8].listaArtefatoSaida[1].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
        expect(lista[8].listaArtefatoSaida[1].numeroAlteracao).toBe(1)
        expect(lista[8].listaArtefatoSaida[1].nomeArtefato).toMatch(/.*GatewayBarTest.java$/g)

        expect(lista[9].listaNumTarefaSaida).toHaveLength(1)
        expect(lista[9].listaNumTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
        expect(lista[9].listaArtefatoSaida).toHaveLength(2)
        expect(lista[9].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
        expect(lista[9].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
        expect(lista[9].listaArtefatoSaida[0].nomeArtefato).toBe('foo/Gruntfile.js')
        expect(lista[9].listaArtefatoSaida[1].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
        expect(lista[9].listaArtefatoSaida[1].numeroAlteracao).toBe(1)
        expect(lista[9].listaArtefatoSaida[1].nomeArtefato).toBe('foo/karma.conf.js')

        // gitFoo.removerDiretorioProjeto()
        // gitBar.removerDiretorioProjeto()
    })

    // afterEach(async () => {
    //     gitUtil.removerDiretorioProjeto()
    // })

    // afterAll(async () => {
    //     gitUtil.removerDiretorioTest()
    // })
})
