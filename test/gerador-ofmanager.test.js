const Param = require('../models/param')
const GeradorTestUtil = require('./gerador-test-util')

const TIPO_MODIFICACAO = require('../lib/constants').TIPO_MODIFICACAO

const nomeProjeto = 'foo'
const autor = 'fulano'

let gitUtil, gerador = {}

describe('test gerais', () => {

    beforeEach(async () => {

        gerador = require('../lib/gerador-ofmanager')
    })

    describe('', () => {

        let gitUtil, params = {}

        beforeEach(async () => {

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

        it('teste do modulo Param com parametros repetidos', () => {

            const params = new Param({
                autor: "fulano",
                listaProjeto: ["bar", "bar", "bar", "bar", "bar", "bar"],
                listaTarefa: ["1111111", "1111111", "1111111"]
            })

            expect(params.listaTarefa).toHaveLength(1)
            expect(params.listaTarefa[0]).toBe('1111111')

            expect(params.listaProjeto).toHaveLength(1)
            expect(params.listaProjeto[0]).toBe('bar')
        })

        it('teste de listagem de artefatos com projeto inválido', () => {

            const paramsError = new Param({
                autor: "fulano",
                listaProjeto: ["qux"],
                listaTarefa: ["1111111"]
            })

            expect.assertions(1);
            expect(gerador(paramsError).gerarListaArtefato()).rejects.toEqual(
                new Error(`Projeto ${paramsError.listaProjeto[0]} não encontrado`));
        })

        it('teste de listagem de artefatos renomeados', async () => {

            await gitUtil.manipularListaArquivoComCommit('1111111', [
                { tipoAlteracao: TIPO_MODIFICACAO.ADDED, pathArquivo: 'arquivoFoo.txt' }
            ])

            await gitUtil.manipularListaArquivoComCommit('1111111', [
                { tipoAlteracao: TIPO_MODIFICACAO.MODIFIED, pathArquivo: 'arquivoFoo.txt' }
            ])

            await gitUtil.manipularArquivoComCommit('1111111',
                { origem: 'arquivoFoo.txt', destino: 'arquivoQux.txt' },
                TIPO_MODIFICACAO.RENAMED
            )

            await gitUtil.manipularArquivoComCommit('2222222',
                'arquivoQux.txt', TIPO_MODIFICACAO.MODIFIED)

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista).toHaveLength(2)

            expect(lista[0].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[0].listaNumeroTarefaSaida[0]).toBe('1111111')
            expect(lista[0].listaArtefatoSaida).toHaveLength(2)

            expect(lista[0].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[0].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[0].nomeArtefato).toBe('foo/arquivoQux.txt')

            expect(lista[0].listaArtefatoSaida[1].tipoAlteracao).toBe(TIPO_MODIFICACAO.RENAMED)
            expect(lista[0].listaArtefatoSaida[1].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[1].nomeArtefato).toBe('foo/arquivoQux.txt')
            expect(lista[0].listaArtefatoSaida[1].nomeAntigoArtefato).toBe('foo/arquivoFoo.txt')
            expect(lista[0].listaArtefatoSaida[1].nomeNovoArtefato).toBe('foo/arquivoQux.txt')

            expect(lista[1].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[1].listaNumeroTarefaSaida[0]).toBe('2222222')
            expect(lista[1].listaArtefatoSaida).toHaveLength(1)

            expect(lista[1].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.MODIFIED)
            expect(lista[1].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[1].listaArtefatoSaida[0].nomeArtefato).toBe('foo/arquivoQux.txt')
        })

        it('teste de listagem de artefatos renomeados 2 vezes', async () => {

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoFoo.txt', TIPO_MODIFICACAO.ADDED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoFoo.txt', TIPO_MODIFICACAO.MODIFIED)

            await gitUtil.manipularArquivoComCommit('1111111',
                { origem: 'arquivoFoo.txt', destino: 'arquivoQux.txt' }, TIPO_MODIFICACAO.RENAMED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoQux.txt', TIPO_MODIFICACAO.MODIFIED)

            await gitUtil.manipularArquivoComCommit('1111111',
                { origem: 'arquivoQux.txt', destino: 'arquivoBar.txt' }, TIPO_MODIFICACAO.RENAMED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.MODIFIED)

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista).toHaveLength(1)

            expect(lista[0].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[0].listaNumeroTarefaSaida[0]).toBe('1111111')
            expect(lista[0].listaArtefatoSaida).toHaveLength(3)

            expect(lista[0].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[0].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[0].nomeArtefato).toBe('foo/arquivoBar.txt')

            expect(lista[0].listaArtefatoSaida[1].tipoAlteracao).toBe(TIPO_MODIFICACAO.RENAMED)
            expect(lista[0].listaArtefatoSaida[1].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[1].nomeArtefato).toBe('foo/arquivoBar.txt')
            expect(lista[0].listaArtefatoSaida[1].nomeAntigoArtefato).toBe('foo/arquivoFoo.txt')
            expect(lista[0].listaArtefatoSaida[1].nomeNovoArtefato).toBe('foo/arquivoQux.txt')

            expect(lista[0].listaArtefatoSaida[2].tipoAlteracao).toBe(TIPO_MODIFICACAO.RENAMED)
            expect(lista[0].listaArtefatoSaida[2].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[2].nomeArtefato).toBe('foo/arquivoBar.txt')
            expect(lista[0].listaArtefatoSaida[2].nomeAntigoArtefato).toBe('foo/arquivoQux.txt')
            expect(lista[0].listaArtefatoSaida[2].nomeNovoArtefato).toBe('foo/arquivoBar.txt')
        })

        it('teste de listagem de artefato A, R, D e A novamente', async () => {

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoFoo.txt', TIPO_MODIFICACAO.ADDED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoFoo.txt', TIPO_MODIFICACAO.MODIFIED)

            await gitUtil.manipularArquivoComCommit('1111111',
                { origem: 'arquivoFoo.txt', destino: 'arquivoQux.txt' }, TIPO_MODIFICACAO.RENAMED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoQux.txt', TIPO_MODIFICACAO.MODIFIED)

            await gitUtil.manipularArquivoComCommit('1111111',
                { origem: 'arquivoQux.txt', destino: 'arquivoBar.txt' }, TIPO_MODIFICACAO.RENAMED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.MODIFIED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.DELETED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoFoo.txt', TIPO_MODIFICACAO.ADDED)

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista).toHaveLength(1)

            expect(lista[0].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[0].listaNumeroTarefaSaida[0]).toBe('1111111')
            expect(lista[0].listaArtefatoSaida).toHaveLength(2)

            expect(lista[0].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.DELETED)
            expect(lista[0].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[0].nomeArtefato).toBe('foo/arquivoBar.txt')

            expect(lista[0].listaArtefatoSaida[1].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[0].listaArtefatoSaida[1].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[1].nomeArtefato).toBe('foo/arquivoFoo.txt')
        })

        it('teste de listagem de artefato A, M, D e A com mesmo nome, COM opção de mostrar deletados', async () => {

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.ADDED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.MODIFIED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.DELETED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.ADDED)

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista).toHaveLength(1)

            expect(lista[0].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[0].listaNumeroTarefaSaida[0]).toBe('1111111')
            expect(lista[0].listaArtefatoSaida).toHaveLength(2)

            expect(lista[0].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.DELETED)
            expect(lista[0].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[0].nomeArtefato).toBe('foo/arquivoBar.txt')

            expect(lista[0].listaArtefatoSaida[1].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[0].listaArtefatoSaida[1].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[1].nomeArtefato).toBe('foo/arquivoBar.txt')
        })

        it('teste de listagem de artefato A, M, D e A com mesmo nome, SEM opção de mostrar deletados', async () => {

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.ADDED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.MODIFIED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.DELETED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.ADDED)

            params.mostrarDeletados = false

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista).toHaveLength(1)

            expect(lista[0].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[0].listaNumeroTarefaSaida[0]).toBe('1111111')
            expect(lista[0].listaArtefatoSaida).toHaveLength(1)

            expect(lista[0].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[0].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[0].nomeArtefato).toBe('foo/arquivoBar.txt')
        })

        it('teste de listagem de artefato A, M, D COM opção de mostrar deletados', async () => {

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.ADDED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.MODIFIED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.DELETED)

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista).toHaveLength(1)

            expect(lista[0].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[0].listaNumeroTarefaSaida[0]).toBe('1111111')
            expect(lista[0].listaArtefatoSaida).toHaveLength(1)

            expect(lista[0].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.DELETED)
            expect(lista[0].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[0].nomeArtefato).toBe('foo/arquivoBar.txt')
        })

        it('teste de listagem de artefato A, M, D SEM opção de mostrar deletados', async () => {

            await gitUtil.manipularArquivoComCommit('1111111', 'arquivoBar.txt', TIPO_MODIFICACAO.ADDED)
            await gitUtil.manipularArquivoComCommit('1111111', 'arquivoBar.txt', TIPO_MODIFICACAO.MODIFIED)
            await gitUtil.manipularArquivoComCommit('1111111', 'arquivoBar.txt', TIPO_MODIFICACAO.DELETED)

            params.mostrarDeletados = false

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista).toHaveLength(0)
        })

        it('teste de listagem de artefato A, M, R, D SEM opção de mostrar deletados', async () => {

            await gitUtil.manipularArquivoComCommit('1111111', 'arquivoBar.txt', TIPO_MODIFICACAO.ADDED)
            await gitUtil.manipularArquivoComCommit('1111111', 'arquivoBar.txt', TIPO_MODIFICACAO.MODIFIED)
            await gitUtil.manipularArquivoComCommit('1111111',
                { origem: 'arquivoBar.txt', destino: 'arquivoFoo.txt' }, TIPO_MODIFICACAO.RENAMED)

            await gitUtil.manipularArquivoComCommit('1111111', 'arquivoFoo.txt', TIPO_MODIFICACAO.DELETED)

            params.mostrarDeletados = false

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista).toHaveLength(0)
        })

        it('teste de listagem de artefatos criados em branches diferentes', async () => {

            await gitUtil.checkoutBranch('branchFoo')
            await gitUtil.manipularArquivoComCommit('1111111', 'arquivoFoo.txt', TIPO_MODIFICACAO.ADDED)

            await gitUtil.checkoutBranch('branchBar')
            await gitUtil.manipularArquivoComCommit('1111111', 'arquivoBar.txt', TIPO_MODIFICACAO.ADDED)

            await gitUtil.checkoutBranch('master')

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista).toHaveLength(1)

            expect(lista[0].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[0].listaNumeroTarefaSaida[0]).toBe('1111111')
            expect(lista[0].listaArtefatoSaida).toHaveLength(2)

            expect(lista[0].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[0].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[0].nomeArtefato).toBe('foo/arquivoFoo.txt')

            expect(lista[0].listaArtefatoSaida[1].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[0].listaArtefatoSaida[1].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[1].nomeArtefato).toBe('foo/arquivoBar.txt')
        })

        it('teste de listagem de artefatos commitados de uma vez', async () => {

            await gitUtil.manipularListaArquivoComCommit('0000000', [
                { tipoAlteracao: TIPO_MODIFICACAO.ADDED, pathArquivo: 'src/app/spas/inventario/bem-services.js' },
                { tipoAlteracao: TIPO_MODIFICACAO.ADDED, pathArquivo: 'Gruntfile.js' },
                { tipoAlteracao: TIPO_MODIFICACAO.ADDED, pathArquivo: 'spec/inclusao-foo-controllers-spec.js' },
                { tipoAlteracao: TIPO_MODIFICACAO.ADDED, pathArquivo: 'src/app/spas/imovel/cadastro/alterar-imovel.tpl.html' },
                { tipoAlteracao: TIPO_MODIFICACAO.ADDED, pathArquivo: 'src/app/spas/imovel/cadastro/cadastro-imovel-controllers.js' },
                { tipoAlteracao: TIPO_MODIFICACAO.ADDED, pathArquivo: 'src/app/spas/imovel/cadastro/cadastro-imovel.tpl.html' },
                { tipoAlteracao: TIPO_MODIFICACAO.ADDED, pathArquivo: 'src/app/spas/imovel/inclusao-foo/inclusao-foo-controllers.js' }
            ])

            await gitUtil.manipularListaArquivoComCommit('1111111', [
                { tipoAlteracao: TIPO_MODIFICACAO.MODIFIED, pathArquivo: 'Gruntfile.js' },
                { tipoAlteracao: TIPO_MODIFICACAO.MODIFIED, pathArquivo: 'src/app/spas/imovel/cadastro/alterar-imovel.tpl.html' },
                { tipoAlteracao: TIPO_MODIFICACAO.MODIFIED, pathArquivo: 'src/app/spas/imovel/cadastro/cadastro-imovel-controllers.js' },
                { tipoAlteracao: TIPO_MODIFICACAO.MODIFIED, pathArquivo: 'src/app/spas/imovel/cadastro/cadastro-imovel.tpl.html' },
                { tipoAlteracao: TIPO_MODIFICACAO.MODIFIED, pathArquivo: 'src/app/spas/imovel/inclusao-foo/inclusao-foo-controllers.js' }
            ])

            await gitUtil.manipularListaArquivoComCommit('1111111', [
                { tipoAlteracao: TIPO_MODIFICACAO.MODIFIED, pathArquivo: 'src/app/spas/imovel/cadastro/cadastro-imovel-controllers.js' },
                { tipoAlteracao: TIPO_MODIFICACAO.MODIFIED, pathArquivo: 'src/app/spas/imovel/cadastro/cadastro-imovel.tpl.html' }
            ])

            await gitUtil.manipularListaArquivoComCommit('1111111', [
                { tipoAlteracao: TIPO_MODIFICACAO.MODIFIED, pathArquivo: 'Gruntfile.js' },
                { tipoAlteracao: TIPO_MODIFICACAO.MODIFIED, pathArquivo: 'spec/inclusao-foo-controllers-spec.js' },
                { tipoAlteracao: TIPO_MODIFICACAO.DELETED, pathArquivo: 'src/app/spas/inventario/bem-services.js' }
            ])

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista).toHaveLength(1)

            expect(lista[0].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[0].listaNumeroTarefaSaida[0]).toBe('1111111')
            expect(lista[0].listaArtefatoSaida).toHaveLength(7)

            expect(lista[0].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.MODIFIED)
            expect(lista[0].listaArtefatoSaida[0].numeroAlteracao).toBe(2)
            expect(lista[0].listaArtefatoSaida[0].nomeArtefato).toMatch(/.*Gruntfile.js$/g)

            expect(lista[0].listaArtefatoSaida[1].tipoAlteracao).toBe(TIPO_MODIFICACAO.MODIFIED)
            expect(lista[0].listaArtefatoSaida[1].numeroAlteracao).toBe(2)
            expect(lista[0].listaArtefatoSaida[1].nomeArtefato).toMatch(/.*cadastro-imovel-controllers.js$/g)

            expect(lista[0].listaArtefatoSaida[2].tipoAlteracao).toBe(TIPO_MODIFICACAO.MODIFIED)
            expect(lista[0].listaArtefatoSaida[2].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[2].nomeArtefato).toMatch(/.*inclusao-foo-controllers.js$/g)

            expect(lista[0].listaArtefatoSaida[3].tipoAlteracao).toBe(TIPO_MODIFICACAO.MODIFIED)
            expect(lista[0].listaArtefatoSaida[3].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[3].nomeArtefato).toMatch(/.*inclusao-foo-controllers-spec.js$/g)

            expect(lista[0].listaArtefatoSaida[4].tipoAlteracao).toBe(TIPO_MODIFICACAO.MODIFIED)
            expect(lista[0].listaArtefatoSaida[4].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[4].nomeArtefato).toMatch(/.*alterar-imovel.tpl.html$/g)

            expect(lista[0].listaArtefatoSaida[5].tipoAlteracao).toBe(TIPO_MODIFICACAO.MODIFIED)
            expect(lista[0].listaArtefatoSaida[5].numeroAlteracao).toBe(2)
            expect(lista[0].listaArtefatoSaida[5].nomeArtefato).toMatch(/.*cadastro-imovel.tpl.html$/g)

            expect(lista[0].listaArtefatoSaida[6].tipoAlteracao).toBe(TIPO_MODIFICACAO.DELETED)
            expect(lista[0].listaArtefatoSaida[6].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[6].nomeArtefato).toMatch(/.*bem-services.js$/g)
        })

        it('tteste ignorar stashes na listagem de artefatos', async () => {

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.ADDED)

            await gitUtil.manipularArquivoSemCommit(
                'arquivoBar.txt', TIPO_MODIFICACAO.MODIFIED)

            await gitUtil.stash()

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista).toHaveLength(1)

            expect(lista[0].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[0].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
            expect(lista[0].listaArtefatoSaida).toHaveLength(1)

            expect(lista[0].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[0].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[0].nomeArtefato).toMatch(/.*arquivoBar.txt$/g)
        })

        it('teste ignorar commits locais na listagem de artefatos', async () => {

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.ADDED)

            params.mostrarCommitsLocais = false

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista).toHaveLength(0)
        })

        xit('teste de listagem de artefato A e M mas mostrando somente A', async () => {

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.ADDED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.MODIFIED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.MODIFIED)

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista).toHaveLength(1)

            expect(lista[0].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[0].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
            expect(lista[0].listaArtefatoSaida).toHaveLength(1)

            expect(lista[0].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[0].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[0].nomeArtefato).toMatch(/.*arquivoBar.txt$/g)
        })

        xit('tteste de listagem de artefato A, M e D mas mostrando somente D', async () => {

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.ADDED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.MODIFIED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.MODIFIED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'arquivoBar.txt', TIPO_MODIFICACAO.DELETED)

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista).toHaveLength(1)

            expect(lista[0].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[0].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
            expect(lista[0].listaArtefatoSaida).toHaveLength(1)

            expect(lista[0].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.DELETED)
            expect(lista[0].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[0].nomeArtefato).toMatch(/.*arquivoBar.txt$/g)
        })

        xit('tteste de listagem de artefato .gitignore', async () => {

            await gitUtil.manipularArquivoComCommit('1111111',
                '.jshintr', TIPO_MODIFICACAO.ADDED)

            await gitUtil.manipularArquivoComCommit('2222222',
                { origem: '.jshintr', destino: '.jshintrc' }, TIPO_MODIFICACAO.RENAMED)

            await gitUtil.manipularArquivoComCommit('1111111',
                'bar/.gitignor', TIPO_MODIFICACAO.ADDED)

            await gitUtil.manipularArquivoComCommit('2222222',
                { origem: 'bar/.gitignor', destino: 'bar/.gitignore' }, TIPO_MODIFICACAO.RENAMED)

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista[0].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[0].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
            expect(lista[0].listaArtefatoSaida).toHaveLength(1)
            expect(lista[0].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[0].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[0].nomeArtefato).toBe('foo/.jshintrc')

            expect(lista[1].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[1].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
            expect(lista[1].listaArtefatoSaida).toHaveLength(1)
            expect(lista[1].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[1].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[1].listaArtefatoSaida[0].nomeArtefato).toBe('foo/bar/.gitignore')

            expect(lista[2].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[2].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['2222222']))
            expect(lista[2].listaArtefatoSaida).toHaveLength(1)
            expect(lista[2].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.RENAMED)
            expect(lista[2].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[2].listaArtefatoSaida[0].nomeArtefato).toBe('foo/.jshintrc')
            expect(lista[2].listaArtefatoSaida[0].nomeAntigoArtefato).toBe('foo/.jshintr')
            expect(lista[2].listaArtefatoSaida[0].nomeNovoArtefato).toBe('foo/.jshintrc')

            expect(lista[3].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[3].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['2222222']))
            expect(lista[3].listaArtefatoSaida).toHaveLength(1)
            expect(lista[3].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.RENAMED)
            expect(lista[3].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[3].listaArtefatoSaida[0].nomeArtefato).toBe('foo/bar/.gitignore')
            expect(lista[3].listaArtefatoSaida[0].nomeAntigoArtefato).toBe('foo/bar/.gitignor')
            expect(lista[3].listaArtefatoSaida[0].nomeNovoArtefato).toBe('foo/bar/.gitignore')
        })

        afterEach(async () => {
            gitUtil.removerDiretorioProjeto()
        })
    })

    describe('', () => {

        /* 
        node app --diretorio=/tmp/gerador-lista-artefato-qas --projeto=qux,baz --autor=fulano --task=1111111 --mostrar-num-modificacao --mostrar-deletados --mostrar-commits-locais
        */
        it('teste separar arquivos de projetos diferentes em linhas diferentes', async () => {

            const gitQux = await new GeradorTestUtil('qux', autor)
            const gitBaz = await new GeradorTestUtil('baz', autor)

            await gitQux.manipularArquivoComCommit('1111111', 'arquivoQux.txt', TIPO_MODIFICACAO.ADDED)
            await gitBaz.manipularArquivoComCommit('1111111', 'arquivoBaz.txt', TIPO_MODIFICACAO.ADDED)

            const params = new Param({
                autor: "fulano",
                listaProjeto: [
                    gitQux.obterCaminhoProjeto(),
                    gitBaz.obterCaminhoProjeto(),
                ],
                listaTarefa: ["1111111"],
                mostrarNumModificacao: true,
                mostrarCommitsLocais: true,
                mostrarDeletados: true,
                mostrarRenomeados: true
            })

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista).toHaveLength(1)

            expect(lista[0].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[0].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
            expect(lista[0].listaArtefatoSaida).toHaveLength(2)

            expect(lista[0].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[0].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[0].nomeArtefato).toMatch(/.*arquivoQux.txt$/g)

            expect(lista[0].listaArtefatoSaida[1].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[0].listaArtefatoSaida[1].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[1].nomeArtefato).toMatch(/.*arquivoBaz.txt$/g)

            gitQux.removerDiretorioProjeto()
            gitBaz.removerDiretorioProjeto()
        })

        /* 
        node app -l OFMANAGER --diretorio=/tmp/gerador-lista-artefato-qas --projeto=abc,def,ghi --autor=fulano --task=1111111,2222222,3333333 --mostrar-num-modificacao --mostrar-deletados --mostrar-commits-locais
        */
        it('teste ordenação dos artefatos dentro da tarefa', async () => {

            const gitAbc = await new GeradorTestUtil('abc', autor)
            const gitDef = await new GeradorTestUtil('def', autor)
            const gitGhi = await new GeradorTestUtil('ghi', autor)

            await gitAbc.manipularArquivoComCommit('0000000', 'arquivoQux.txt', TIPO_MODIFICACAO.ADDED)
            await gitDef.manipularArquivoComCommit('0000000', 'arquivoBaz.txt', TIPO_MODIFICACAO.ADDED)
            await gitGhi.manipularArquivoComCommit('0000000', 'arquivoIhx.txt', TIPO_MODIFICACAO.ADDED)
            await gitAbc.manipularArquivoComCommit('0000000', 'arquivoFoo.txt', TIPO_MODIFICACAO.ADDED)
            await gitDef.manipularArquivoComCommit('0000000', 'arquivoBar.txt', TIPO_MODIFICACAO.ADDED)
            await gitGhi.manipularArquivoComCommit('0000000', 'arquivoTyu.txt', TIPO_MODIFICACAO.ADDED)

            await gitAbc.manipularArquivoComCommit('0000000', '.jshintr', TIPO_MODIFICACAO.ADDED)
            await gitAbc.manipularArquivoComCommit('0000000', 'karma-tpz.config.js', TIPO_MODIFICACAO.ADDED)
            await gitAbc.manipularArquivoComCommit('0000000', 'arquivoTyuGateway.java', TIPO_MODIFICACAO.ADDED)

            await gitGhi.manipularArquivoComCommit('1111111', 'arquivoOux.txt', TIPO_MODIFICACAO.ADDED)
            await gitGhi.manipularArquivoComCommit('1111111', 'arquivoPty.txt', TIPO_MODIFICACAO.ADDED)
            await gitGhi.manipularArquivoComCommit('1111111', 'arquivoXvc.txt', TIPO_MODIFICACAO.ADDED)
            
            await gitAbc.manipularArquivoComCommit('1111111',
                { origem: '.jshintr', destino: '.jshintrc' }, TIPO_MODIFICACAO.RENAMED)

            await gitAbc.manipularArquivoComCommit('1111111', 'gruntfile-yuiq.js', TIPO_MODIFICACAO.ADDED)
            await gitAbc.manipularArquivoComCommit('1111111', 'arquivoPty.ori', TIPO_MODIFICACAO.ADDED)
            await gitAbc.manipularArquivoComCommit('1111111', 'ResourcearquivoRtu.java', TIPO_MODIFICACAO.ADDED)
            await gitAbc.manipularArquivoComCommit('1111111', 'arquivoOux.txt', TIPO_MODIFICACAO.ADDED)
            await gitAbc.manipularArquivoComCommit('1111111', 'arquivoPty.txt', TIPO_MODIFICACAO.ADDED)
            await gitAbc.manipularArquivoComCommit('1111111', 'arquivoUpeGateway.java', TIPO_MODIFICACAO.ADDED)
            await gitAbc.manipularArquivoComCommit('1111111', 'arquivoTyuGateway.java', TIPO_MODIFICACAO.DELETED)
            await gitAbc.manipularArquivoComCommit('1111111', 'gruntfile-hko.js', TIPO_MODIFICACAO.ADDED)
            await gitAbc.manipularArquivoComCommit('1111111', 'arquivoPty.txt', TIPO_MODIFICACAO.ADDED)
            await gitAbc.manipularArquivoComCommit('1111111', 'arquivoTyuResource.java', TIPO_MODIFICACAO.ADDED)
            await gitAbc.manipularArquivoComCommit('1111111', 'arquivo-qux-spec.js', TIPO_MODIFICACAO.ADDED)
            await gitAbc.manipularArquivoComCommit('1111111', 'arquivo-qwe-spec.js', TIPO_MODIFICACAO.ADDED)
            await gitAbc.manipularArquivoComCommit('1111111', 'karma-pty.config.js', TIPO_MODIFICACAO.ADDED)
            await gitAbc.manipularArquivoComCommit('1111111', 'karma-tpz.config.js', TIPO_MODIFICACAO.DELETED)
            await gitAbc.manipularArquivoComCommit('1111111', 'GatewayArquivoAqw.java', TIPO_MODIFICACAO.ADDED)

            await gitAbc.manipularArquivoComCommit('1111111',
                { origem: '.jshintrc', destino: '.jshintrcplo' }, TIPO_MODIFICACAO.RENAMED)

            await gitGhi.manipularArquivoComCommit('1111111', 'arquivoIhx.txt', TIPO_MODIFICACAO.MODIFIED)
            await gitAbc.manipularArquivoComCommit('1111111', 'arquivoFoo.txt', TIPO_MODIFICACAO.MODIFIED)
            await gitDef.manipularArquivoComCommit('1111111', 'arquivoBaz.txt', TIPO_MODIFICACAO.MODIFIED)

            await gitAbc.manipularArquivoComCommit('2222222', 'arquivoFoo.txt', TIPO_MODIFICACAO.MODIFIED)
            await gitAbc.manipularArquivoComCommit('2222222', 'arquivoFoo.txt', TIPO_MODIFICACAO.MODIFIED)

            await gitAbc.manipularArquivoComCommit('3333333', 'arquivoFoo.txt', TIPO_MODIFICACAO.ADDED)

            const params = new Param({
                autor: "fulano",
                listaProjeto: [
                    gitAbc.obterCaminhoProjeto(),
                    gitDef.obterCaminhoProjeto(),
                    gitGhi.obterCaminhoProjeto(),
                ],
                listaTarefa: ["1111111","2222222","3333333"],
                mostrarNumModificacao: true,
                mostrarCommitsLocais: true,
                mostrarDeletados: true,
                mostrarRenomeados: true
            })

            const lista = await gerador(params).gerarListaArtefato()
            // require('../lib/printer')({mostrarNumModificacao: true}, lista).imprimirListaSaida()

            expect(lista).toHaveLength(3)

            gitAbc.removerDiretorioProjeto()
            gitDef.removerDiretorioProjeto()
            gitGhi.removerDiretorioProjeto()
        })

        /*
        node app --diretorio=/tmp/gerador-lista-artefato-qas --projeto=foo,bar --autor=fulano --task=1111111,2222222 --mostrar-num-modificacao --mostrar-deletados --mostrar-commits-locais --mostrar-renomeados
        */
        xit('teste de listagem com arquivos com tipos diferentes separados', async () => {

            const gitFoo = await new GeradorTestUtil('foo', autor)
            const gitBar = await new GeradorTestUtil('bar', autor)

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

            await gitBar.manipularArquivoComCommit('2222222', 'frzzy-controller.html', TIPO_MODIFICACAO.ADDED)
            await gitBar.manipularArquivoComCommit('2222222',
                { origem: 'frzzy-controller.html', destino: 'walzz-controller.html' }, TIPO_MODIFICACAO.RENAMED)
            await gitBar.manipularArquivoComCommit('2222222',
                { origem: 'walzz-controller.html', destino: 'yrizz-controller.html' }, TIPO_MODIFICACAO.RENAMED)

            const lista = await gerador(params).gerarListaArtefato()

            expect(lista).toHaveLength(10)

            expect(lista[0].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[0].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
            expect(lista[0].listaArtefatoSaida).toHaveLength(1)
            expect(lista[0].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[0].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[0].listaArtefatoSaida[0].nomeArtefato).toMatch(/.*bar-controller.js$/g)

            expect(lista[1].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[1].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
            expect(lista[1].listaArtefatoSaida).toHaveLength(1)
            expect(lista[1].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[1].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[1].listaArtefatoSaida[0].nomeArtefato).toMatch(/.*foo-controller.html$/g)

            expect(lista[2].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[2].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
            expect(lista[2].listaArtefatoSaida).toHaveLength(1)
            expect(lista[2].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[2].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[2].listaArtefatoSaida[0].nomeArtefato).toMatch(/.*foo-controller.js$/g)

            expect(lista[3].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[3].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
            expect(lista[3].listaArtefatoSaida).toHaveLength(1)
            expect(lista[3].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.DELETED)
            expect(lista[3].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[3].listaArtefatoSaida[0].nomeArtefato).toMatch(/.*bar-controller.html$/g)

            expect(lista[4].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[4].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['2222222']))
            expect(lista[4].listaArtefatoSaida).toHaveLength(1)
            expect(lista[4].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.MODIFIED)
            expect(lista[4].listaArtefatoSaida[0].numeroAlteracao).toBe(2)
            expect(lista[4].listaArtefatoSaida[0].nomeArtefato).toBe('foo/foo-controller.html')

            expect(lista[5].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[5].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
            expect(lista[5].listaArtefatoSaida).toHaveLength(2)
            expect(lista[5].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[5].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[5].listaArtefatoSaida[0].nomeArtefato).toMatch(/.*BazResource.java$/g)
            expect(lista[5].listaArtefatoSaida[1].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[5].listaArtefatoSaida[1].numeroAlteracao).toBe(1)
            expect(lista[5].listaArtefatoSaida[1].nomeArtefato).toMatch(/.*BazResourceTest.java$/g)

            expect(lista[7].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[7].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['1111111']))
            expect(lista[7].listaArtefatoSaida).toHaveLength(2)
            expect(lista[7].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[7].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[7].listaArtefatoSaida[0].nomeArtefato).toBe('foo/Gruntfile.js')
            expect(lista[7].listaArtefatoSaida[1].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[7].listaArtefatoSaida[1].numeroAlteracao).toBe(1)
            expect(lista[7].listaArtefatoSaida[1].nomeArtefato).toBe('foo/karma.conf.js')

            expect(lista[8].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[8].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['2222222']))
            expect(lista[8].listaArtefatoSaida).toHaveLength(2)
            expect(lista[8].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[8].listaArtefatoSaida[0].numeroAlteracao).toBe(1)
            expect(lista[8].listaArtefatoSaida[0].nomeArtefato).toBe('bar/quuz-controller.html')
            expect(lista[8].listaArtefatoSaida[1].tipoAlteracao).toBe(TIPO_MODIFICACAO.ADDED)
            expect(lista[8].listaArtefatoSaida[1].numeroAlteracao).toBe(1)
            expect(lista[8].listaArtefatoSaida[1].nomeArtefato).toBe('bar/yrizz-controller.html')

            expect(lista[9].listaNumeroTarefaSaida).toHaveLength(1)
            expect(lista[9].listaNumeroTarefaSaida).toEqual(expect.arrayContaining(['2222222']))
            expect(lista[9].listaArtefatoSaida).toHaveLength(2)

            expect(lista[9].listaArtefatoSaida[0].tipoAlteracao).toBe(TIPO_MODIFICACAO.RENAMED)
            expect(lista[9].listaArtefatoSaida[0].numeroAlteracao).toBe(2)
            expect(lista[9].listaArtefatoSaida[0].nomeArtefato).toBe('bar/quuz-controller.html')
            expect(lista[9].listaArtefatoSaida[0].nomeAntigoArtefato).toBe('bar/qux-controller.html')
            expect(lista[9].listaArtefatoSaida[0].nomeNovoArtefato).toBe('bar/quuz-controller.html')

            expect(lista[9].listaArtefatoSaida[1].tipoAlteracao).toBe(TIPO_MODIFICACAO.RENAMED)
            expect(lista[9].listaArtefatoSaida[1].numeroAlteracao).toBe(2)
            expect(lista[9].listaArtefatoSaida[1].nomeArtefato).toBe('bar/yrizz-controller.html')
            expect(lista[9].listaArtefatoSaida[1].nomeAntigoArtefato).toBe('bar/frzzy-controller.html')
            expect(lista[9].listaArtefatoSaida[1].nomeNovoArtefato).toBe('bar/yrizz-controller.html')

            gitFoo.removerDiretorioProjeto()
            gitBar.removerDiretorioProjeto()
        })
    })

    afterEach(async () => {
        (await new GeradorTestUtil('', '')).removerDiretorioTest()
    })
})