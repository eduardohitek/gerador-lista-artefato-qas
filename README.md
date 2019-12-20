# Gerador de listagem de artefatos do QAS

Comando para listar os artefatos incluídos/alterados/renomeados para geração do QAS

## Pré-requisitos 

### Sistema

- Git versão mínima v2.7.4

### Git

- Executar o comando `git pull --all` antes de usar o script
- Não utilizar espaços nos nomes dos arquivos
- Configurar corretamente as variáveis do Git `user.name` e `user.email` com matrícula e email
- Verificar se os merges estão sendo realizados de maneira correta
- Utilizar o comando `git mv` para renomear os artefatos

## Instalação

### Linux 

- Baixe [aqui](https://raw.githubusercontent.com/diegomdrs/gerador-lista-artefato-qas/master/dist/gerador-lista-artefato-qas-linux) a versão Linux e salve no seu computador

- Em seguida, execute o comando abaixo:

``` console
$ chmod +x gerador-lista-artefato-qas-linux
```

### Windows 

- Baixe [aqui](https://raw.githubusercontent.com/diegomdrs/gerador-lista-artefato-qas/master/dist/gerador-lista-artefato-qas-win.exe) a versão Windows e salve no seu computador

## Uso

### Linux

``` console
$ ./gerador-lista-artefato-qas-linux --diretorio=/kdi/git --projeto=foo-estatico,foo-api --autor=X1337 --task=900089,900081
```

### Windows

``` console
$ ./gerador-lista-artefato-qas-win.exe --diretorio=C:/kdi/git --projeto=foo-estatico,foo-api --autor=X1337 --task=900089,900081
```

## Parâmetros

- -d, --diretorio: Diretório raiz dos projetos Git
- -p, --projeto: Lista de projetos Git (podem ser passados vários projetos separados por vírgula)
- -a, --autor <type>: Matrícula do autor dos commits
- -t, --task <type>: Lista de tarefas (podem ser passadas várias tarefas separadas por vírgula)
- --mostrar-num-modificacao: Nº de modificações do artefato na tarefa ou tarefas (Opcional)
- --mostrar-deletados: Mostra artefatos deletados na tarefa (Opcional)
- -v, --version: Mostra a versão do programa
- -h, --help: output usage information

## Saida do gerador

``` console
$ node gerador-artefato --diretorio=/kdi/git --projeto=foo-estatico,foo-api --autor=X1337 --task=900089,900081 --mostrar-deletados --mostrar-num-modificacao

Tarefa nº 900089

M   2   foo-api/src/main/java/br/com/foo/api/v1/foo/gateway/GatewayConsultarFoo.java
M   3   foo-api/src/main/java/br/com/foo/api/v1/foo/gateway/GatewayIncluirFoo.java
A   1   foo-api/src/main/java/br/com/foo/api/v1/foo/gateway/GatewayIncluirFoo.java
M   1   foo-estatico/Gruntfile.js
M   1   foo-estatico/karma.conf.js
M   1   foo-estatico/package.json
R   1   foo-estatico/foo.json foo-estatico/bar.json
D   1   foo-estatico/src/app/spas/foo/detalha-foo.tpl.html

```
Onde:

- Ação executada no artefato na tarefa - A (Added), M (Modified), R (Renamed) e D (Deleted)
- Nº de modificações do artefato na tarefa - se utilizado o parâmetro `--mostrar-num-modificacao`
- Caminho do artefato

## Exemplo de uso

``` console
$ node gerador-artefato --diretorio=/kdi/git --projeto=foo-estatico,foo-api --autor=X1337 --task=900077,900079

Tarefas nº 900077, 900079

M      foo-estatico/Gruntfile.js

Tarefa nº 900077

M      foo-estatico/src/app/spas/foo/inclusao-foo.tpl.html
A      foo-estatico/src/app/spas/foo/inclusao-foo.tpl.html
M      foo-estatico/src/app/spas/foo/altera-foo.tpl.html

Tarefa nº 900079

M       foo-api/pom.xml
M       foo-api/operacoes.xml

```

