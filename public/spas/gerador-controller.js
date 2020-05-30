angular
    .module('geradorApp')
    .controller('GeradorController', GeradorController)

GeradorController.$inject = ['geradorService', 'blockUI', 'clipboardUtil', 'geradorConstants', 'deviceDetector'];

function GeradorController(geradorService, blockUI, clipboardUtil, geradorConstants, deviceDetector) {
    var vm = this

    vm.listaSaida = []
    vm.req = {}

    vm.TIPO_ALERTA = geradorConstants.TIPO_ALERTA
    vm.TIPO_MODIFICACAO = geradorConstants.TIPO_MODIFICACAO
    vm.TIPO_LISTAGEM = geradorConstants.TIPO_LISTAGEM

    vm.init = init
    vm.listarArtefatos = listarArtefatos
    vm.limparFiltros = limparFiltros

    vm.obterNumero = obterNumero
    vm.adicionarCaminhoProjeto = adicionarCaminhoProjeto
    vm.removerCaminhoProjeto = removerCaminhoProjeto
    vm.adicionarTask = adicionarTask
    vm.removerTask = removerTask
    vm.obterNomeProjeto = obterNomeProjeto
    vm.obterNomeArtefato = obterNomeArtefato
    vm.copiarLinhaTabelaClipboard = copiarLinhaTabelaClipboard
    vm.copiarTabelaPlainTextClipboard = copiarTabelaPlainTextClipboard
    vm.copiarTabelaClipboard = copiarTabelaClipboard

    async function init() {

        limparMessages()
        limparFiltros()

        // TODO - Remover
        vm.req.listaTarefa = ["1111111","2222222","3333333"]
        vm.req.autor = 'fulano'

        listarDiretorioPadrao()
    }

    function listarDiretorioPadrao() {

        listarDiretorio([geradorConstants.TIPO_DIRETORIO_PADRAO[deviceDetector.os]])
            .then(({ data }) => {
                vm.req.listaProjeto = data
            })
    }

    function listarDiretorio(listaDiretorio) {

        blockUI.start()

        return geradorService.listarDiretorio(listaDiretorio)
            .catch((error) => {

                adicionarMensagemErro(error.data.message,
                    geradorConstants.TIPO_POSICAO_ALERT.DEFAULT)

                vm.listaCaminhoProjeto = []

            }).finally(() => blockUI.stop())
    }

    function listarArtefatos() {

        limparMessages()

        if (vm.req.listaTarefa.length && vm.req.listaProjeto.length) {

            vm.req.tipoListagem = vm.tipoListagem

            blockUI.start()

            geradorService.gerarListaArtefato(vm.req)
                .then((resposta) => {

                    vm.listaSaida = resposta.data

                    !vm.listaSaida.length && adicionarMensagemErro
                        ('Nenhum resultado encontrado', geradorConstants.TIPO_POSICAO_ALERT.DEFAULT)

                }).catch((error) => {

                    adicionarMensagemErro(error.data.message,
                        geradorConstants.TIPO_POSICAO_ALERT.DEFAULT)

                    vm.listaSaida = []

                }).finally(() => blockUI.stop())

        } else {

            !vm.req.listaTarefa.length && adicionarMensagemErro
                ('Adicione ao menos uma tarefa ao filtro', geradorConstants.TIPO_POSICAO_ALERT.DEFAULT)

            !vm.req.listaProjeto.length && adicionarMensagemErro
                ('Adicione ao menos um projeto ao filtro', geradorConstants.TIPO_POSICAO_ALERT.DEFAULT)
        }
    }

    function obterNumero(saida) {

        if (saida.listaArtefatoSaida.length === 1)
            return saida.listaNumeroTarefaSaida.length
        else
            return saida.listaArtefatoSaida.length
    }

    function removerTask(taskRemocao) {

        limparMessages()

        vm.req.listaTarefa = vm.req.listaTarefa.filter(tarefa =>
            tarefa !== taskRemocao)
    }

    function adicionarTask() {

        limparMessages()

        if (vm.listaTarefa) {

            const listaTarefa = vm.listaTarefa.split(',')

            for (const tarefa of listaTarefa) {

                const contemTarefa = vm.req.listaTarefa.some((tarefaSome) =>
                    tarefa === tarefaSome)

                if (!contemTarefa)
                    vm.req.listaTarefa.push(tarefa)
                else
                    adicionarMensagemErro(`${tarefa} já consta na lista de tarefas`,
                        geradorConstants.TIPO_POSICAO_ALERT.DEFAULT)
            }

            delete vm.listaTarefa
        }
    }

    async function adicionarCaminhoProjeto() {

        limparMessages()

        if (vm.listaCaminhoProjeto) {

            const listaProjeto = vm.listaCaminhoProjeto.split(',')
            const listaPesquisa = []

            for (const projeto of listaProjeto) {

                const contemProjeto = vm.req.listaProjeto.some((projetoSome) =>
                    projeto.trim() === projetoSome)

                if (!contemProjeto)
                    listaPesquisa.push(projeto.trim())
                else
                    adicionarMensagemErro(`${projeto.trim()} já consta na lista de projetos`,
                        geradorConstants.TIPO_POSICAO_ALERT.DEFAULT)
            }

            if (listaPesquisa.length) {

                listarDiretorio(listaPesquisa).then(({ data }) => {

                    if (data.length) {
                        for (const diretorio of data)
                            if (!vm.req.listaProjeto.some(proj => proj === diretorio))
                                vm.req.listaProjeto.push(diretorio)
                    }
                    else
                        adicionarMensagemErro('Nenhum diretório encontrado',
                            geradorConstants.TIPO_POSICAO_ALERT.DEFAULT)
                })

                delete vm.listaCaminhoProjeto
            }
        }
    }

    function removerCaminhoProjeto(caminhoRemocao) {

        limparMessages()

        vm.req.listaProjeto = vm.req.listaProjeto.filter(caminho =>
            caminho !== caminhoRemocao)
    }

    function limparMessages() {

        vm.alerts = []
    }

    function adicionarMensagemSucesso(mensagem, tipo) {
        adicionarMensagem(vm.TIPO_ALERTA.SUCCESS, mensagem, tipo)
    }

    function adicionarMensagemErro(mensagem, tipo) {
        adicionarMensagem(vm.TIPO_ALERTA.ERROR, mensagem, tipo)
    }

    function adicionarMensagem(tipoAlerta, mensagem, tipo) {

        const message = {
            tipoAlerta: tipoAlerta,
            text: mensagem,
            tipo: tipo,
        }

        vm.alerts.push(message)
    }

    function limparFiltros() {

        limparMessages()

        vm.tipoListagem = vm.TIPO_LISTAGEM.OFMANAGER

        vm.req = {
            listaProjeto: [],
            listaTarefa: [],
            mostrarDeletados: false,
            mostrarRenomeados: false,

            // TODO - Remover
            mostrarCommitsLocais: true
        }

        delete vm.listaSaida
        delete vm.listaCaminhoProjeto
        delete vm.listaTarefa
    }

    function obterNomeProjeto(caminhoProjeto) {

        return caminhoProjeto.match(/([^/|\\]*)$/g)[0]
    }

    function obterNomeArtefato(artefato) {

        return (artefato.tipoAlteracao === 'R')
            ? artefato.nomeAntigoArtefato + ' ' + artefato.nomeNovoArtefato
            : artefato.nomeArtefato
    }

    function copiarTabelaPlainTextClipboard() {

        limparMessages()

        clipboardUtil.copiarTabelaClipboard(vm.listaSaida)

        adicionarMensagemSucesso('Dados da tabela copiados para o clipboard',
            geradorConstants.TIPO_POSICAO_ALERT.TOP)
    }

    function copiarTabelaClipboard() {

        limparMessages()

        clipboardUtil.copiarTabelaClipboardTabulado(vm.listaSaida)

        adicionarMensagemSucesso('Dados da tabela copiados para o clipboard',
            geradorConstants.TIPO_POSICAO_ALERT.TOP)
    }

    function copiarLinhaTabelaClipboard(saida) {

        limparMessages()

        clipboardUtil.copiarTabelaClipboard([saida])

        adicionarMensagemSucesso('Dados da linha copiados para o clipboard',
            geradorConstants.TIPO_POSICAO_ALERT.TOP)
    }
}