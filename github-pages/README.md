# Versão estática para GitHub Pages

Esta pasta contém uma alternativa sem servidor para o site público. Ela reproduz a navegação, a apresentação, o catálogo por categorias, os preços e o fluxo de pedido de informações da página principal. O formulário **não salva pedidos**: ele apenas abre o WhatsApp da Jaqueline com a mensagem preenchida; nada é enviado automaticamente.

## Estrutura

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Estrutura semântica, navegação e conteúdo público. |
| `styles.css` | Interface responsiva alinhada à paleta e à composição do site completo. |
| `catalog.js` | Fonte única dos serviços, categorias, preços e texto da mensagem. |
| `app.js` | Filtros, seleção de serviço, menu móvel e abertura manual do WhatsApp. |

## Limitações

O painel administrativo, o banco de pedidos, a edição de serviços pelo navegador e o controle de acesso não funcionam em GitHub Pages, pois ele hospeda somente arquivos estáticos. Para atualizar serviços e preços nesta alternativa, edite a constante `services` em `catalog.js`, faça commit e aguarde a publicação.

## Publicação

O fluxo em `.github/workflows/deploy-pages.yml` publica esta pasta. Como a fonte GitHub Actions já está ativada no repositório, cada atualização enviada à branch `main` é publicada automaticamente em `https://arthursousaa.github.io/studio-henriques/`.
