angular
    .module('geradorApp')
    .constant('geradorConstants', {

        TIPO_LISTAGEM: {
            OFMANAGER: 'OFMANAGER',
            QAS: 'QAS'
        },

        TIPO_MODIFICACAO: {
            A: 'Criado',
            M: 'Alterado',
            R: 'Renomeado',
            D: 'Deletado'
        },

        TIPO_ALERTA: {
            SUCCESS: { class: 'alert-success', icone: '✓' },
            ERROR: { class: 'alert-danger', icone: '✗' },
        },

        TIPO_POSICAO_ALERT: {
            DEFAULT: { class: 'alert alert-dismissible' },
            TOP: { class: 'alert alert-dismissible container alert-top' },
        },

        TIMEOUT_ALERTA: 4000,

        TIPO_DIRETORIO_PADRAO: {
            windows: 'C:/kdi/git',
            linux: '/kdi/git',
            mac: '/kdi/git'
        },
    })