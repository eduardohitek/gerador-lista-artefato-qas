const util = require('util')
const path = require('path')
const exec = util.promisify(require('child_process').exec)
const fs = require('fs-extra')

const Comando = require('../models/comando-git')
const Arquivo = require('../models/arquivo')
const Tarefa = require('../models/tarefa')
const Artefato = require('../models/artefato')
const SaidaVO = require('../models/saida-vo')

const geradorUtil = require('../util/gerador-util')

const TIPO_MODIFICACAO = require('./constants').TIPO_MODIFICACAO
const TIPO_ARTEFATO = require('./constants').TIPO_ARTEFATO

module.exports = (diretorio) => {

  return {

    listarDiretorios: async () => {

      try {

        if (fs.lstatSync(diretorio).isDirectory()) {

          const lista = []

          foo(diretorio, lista)

          return lista

        } else {
          throw new Error(`${diretorio} não é um diretório`)
        }
      } catch (error) {
        throw new Error(error.message)
      }
    }
  }

  function foo(diretorio, lista) {

    let listaSubDiretorio = fs.readdirSync(diretorio).filter(dir => 
      fs.lstatSync(path.join(diretorio, dir)).isDirectory()
    )
    
    return listaSubDiretorio.map(subDiretorio => {

      const baz = path.join(diretorio, subDiretorio)

      if(subDiretorio === '.git')
        lista.push(diretorio)

      foo(baz, lista)
    })
  }
}