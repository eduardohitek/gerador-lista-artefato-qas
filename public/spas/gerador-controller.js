angular
    .module('geradorApp')
    .controller('GeradorController', GeradorController)

GeradorController.$inject = ['FileSaver', 'Blob', 'geradorService', 'blockUI', 'clipboardUtil', 'geradorConstants', 'deviceDetector'];

function GeradorController(FileSaver, Blob, geradorService, blockUI, clipboardUtil, geradorConstants, deviceDetector) {
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
    vm.exportarArquivoCsv = exportarArquivoCsv
    vm.exportarArquivoTxt = exportarArquivoTxt

    async function init() {

        vm.cars = [{
            "brand": "Audi",
            "model": "A1"
        }, {
            "brand": "Audi",
            "model": "A2"
        }, {
            "brand": "Audi",
            "model": "A3"
        }, {
            "brand": "BMW",
            "model": "3 Series"
        }, {
            "brand": "BMW",
            "model": "5 Series"
        }]

        vm.lista = [{
            tarefa: '1111111',
            listaArtefato: [
                {
                    tipoAlteracao: "A",
                    nomeArtefato: "A1"
                },
                {
                    tipoAlteracao: "A",
                    nomeArtefato: "A2"
                },
                {
                    tipoAlteracao: "M",
                    nomeArtefato: "A2"
                }
            ]            
        }]
        
        // {
        //     tarefa: "1111111",
        //     tipoAlteracao: 'A'
        // }, {
        //     tarefa: "1111111",
        //     tipoAlteracao: 'A'
        // }, {
        //     tarefa: "2222222",
        //     tipoAlteracao: 'A'
        // }, {
        //     tarefa: "2222222",
        //     tipoAlteracao: 'A'
        // }]

        limparMessages()
        limparFiltros()

        // TODO - Remover
        vm.req.listaTarefa = ["1111111", "2222222", "3333333"]
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

    function exportarArquivoCsv() {

        limparMessages()

        blockUI.start()

        geradorService.obterListaArtefatoCsv(vm.req)
            .then((resposta) => {

                if (resposta.data) {

                    var data = new Blob([resposta.data], { type: 'text/csv;charset=utf-8' })
                    FileSaver.saveAs(data, 'lista-artefato.csv')

                } else
                    adicionarMensagemErro
                        ('Nenhum resultado encontrado', geradorConstants.TIPO_POSICAO_ALERT.DEFAULT)

            }).catch((error) => {

                adicionarMensagemErro(error.data.message,
                    geradorConstants.TIPO_POSICAO_ALERT.DEFAULT)

            }).finally(() => blockUI.stop())
    }

    function exportarArquivoTxt() {

        limparMessages()

        const textoSaida = obterTextoListaSaida(vm.listaSaida)

        var data = new Blob([textoSaida], { type: 'text/txt;charset=utf-8' })
        FileSaver.saveAs(data, 'lista-artefato.txt')
    }

    function copiarLinhaTabelaClipboard(saida) {

        limparMessages()

        const textoSaida = obterTextoListaSaida([saida])
        clipboardUtil.copiarTabelaClipboard(textoSaida)

        adicionarMensagemSucesso('Dados da linha copiados para o clipboard',
            geradorConstants.TIPO_POSICAO_ALERT.TOP)
    }

    function obterTextoListaSaida(listaSaida) {

        return listaSaida.reduce((saidaTexto, saida) => {

            if (saida.listaNumeroTarefaSaida.length === 1)
                saidaTexto = saidaTexto.concat(
                    `\nTarefa nº ${saida.listaNumeroTarefaSaida[0]}\n`)

            else if (saida.listaNumeroTarefaSaida.length > 1)
                saidaTexto = saidaTexto.concat(
                    `\nTarefas nº ${saida.listaNumeroTarefaSaida.join(', ')}\n`)

            for (const artefato of saida.listaArtefatoSaida)
                saidaTexto = saidaTexto.concat(obterListaArtefato(artefato))

            saidaTexto = saidaTexto.concat('\n')

            return saidaTexto
        }, '')
    }

    function obterListaArtefato(artefato) {

        let retorno = `\n${artefato.tipoAlteracao}\t`

        if (artefato.tipoAlteracao === geradorConstants.TIPO_MODIFICACAO.RENAMED)
            retorno = retorno.concat(`${artefato.nomeAntigoArtefato}\t${artefato.nomeNovoArtefato}`)
        else
            retorno = retorno.concat(artefato.nomeArtefato)

        return retorno
    }
}