# Anexos

Cada chamado pode ter **um** anexo — não múltiplos arquivos.

## Formatos e limite

- **Formatos aceitos:** JPG, PNG, PDF, DOCX.
- **Tamanho máximo:** 5 MB.

Um arquivo fora desses formatos ou tamanho é rejeitado com uma mensagem explicando o motivo, tanto ao criar o chamado quanto ao anexar depois.

## Adicionar na criação

Ao abrir um chamado, o campo de anexo é opcional. Se um arquivo for enviado, o chamado só é considerado criado depois que o upload é concluído com sucesso.

## Substituir ou remover

Na tela de detalhes do chamado, é possível:

- **Substituir** o anexo atual por outro arquivo (o anterior é removido do armazenamento).
- **Remover** o anexo sem enviar um novo.

## Onde fica armazenado

Os anexos ficam em um bucket do Google Cloud Storage, acessíveis por uma URL pública única por arquivo. Não é possível anexar mais de um arquivo por chamado — para enviar outro, é preciso substituir o existente.
