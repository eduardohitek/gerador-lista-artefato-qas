module.exports = Object.freeze({

    PORT: 3333,
    HOST: 'localhost',

    TIPO_LISTAGEM: {
        QAS: 'QAS', OFMANAGER: 'OFMANAGER'
    },

    TIPO_MODIFICACAO: {
        ADDED: 'A',
        MODIFIED: 'M',
        RENAMED: 'R',
        DELETED: 'D'
    },

    TIPO_ARTEFATO: {
        JAVA_RESOURCE: [
            { regex: /.*resource.*\.java$/gi }
        ],
        JAVA_GATEWAY: [
            { regex: /.*gateway.*\.java$/gi }
        ],
        JS_CONFIG: [
            { regex: /.*(karma|gruntfile).*\.js$/gi }
        ],
        OUTROS: [
            { regex: /.+/g }
        ]
    }
});