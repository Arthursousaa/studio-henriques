# Versão estática para GitHub Pages

Esta pasta contém uma alternativa sem servidor para o site público. Ela preserva apresentação, filtros, preços e contato. O formulário **não salva pedidos**: ele apenas abre o WhatsApp da Jaqueline com a mensagem preenchida; nada é enviado automaticamente.

## Limitações

O painel administrativo, o banco de pedidos, a edição de serviços pelo navegador e o controle de acesso não funcionam em GitHub Pages, pois ele hospeda somente arquivos estáticos. Para atualizar serviços e preços nesta alternativa, edite a constante `services` em `app.js`, faça commit e aguarde a publicação.

## Publicação

O fluxo em `.github/workflows/deploy-pages.yml` publica esta pasta. No repositório do GitHub, abra **Settings → Pages** e selecione **GitHub Actions** como fonte. Após a próxima atualização da branch `main`, o GitHub exibirá o link gratuito no formato `https://arthursousaa.github.io/studio-henriques/`.
