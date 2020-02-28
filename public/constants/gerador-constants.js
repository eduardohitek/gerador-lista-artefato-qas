angular
    .module('geradorApp')
    .constant('geradorConstants', {

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
            WINDOWS: { key: 'windows', diretorio: 'C:/kdi/git' },
            LINUX: { key: 'linux', diretorio: '/kdi/git' },
            MAC: { key: 'mac', diretorio: '/kdi/git' }
        },
    })