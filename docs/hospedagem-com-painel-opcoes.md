# Hospedagem da versão completa com painel

O GitHub Pages hospeda somente arquivos estáticos. Por isso, ele não consegue executar o servidor Node, salvar pedidos, autenticar administradoras nem permitir a edição de preços. O GitHub continuará sendo o repositório do código, mas a versão completa precisa de um serviço de aplicação e de um banco de dados.

| Alternativa | Compatibilidade com o site atual | Pontos de atenção |
| --- | --- | --- |
| Render | Aceita serviços web Node e publica a partir de repositórios GitHub. | A instância gratuita entra em repouso após 15 minutos; o Postgres gratuito expira após 30 dias, portanto não é adequado para manter os pedidos do Studio permanentemente sem custo. [1] |
| Cloudflare Workers + D1 | Possui camada dinâmica e banco D1 disponíveis no plano gratuito. | Exige adaptação importante do servidor Express, do banco MySQL/TiDB e da autenticação atual para a arquitetura Cloudflare. O plano gratuito possui limites de execução. [2] |
| Koyeb | Documenta publicação contínua a partir de repositórios GitHub e configuração de variáveis, porta e comandos de execução. | É necessário validar o plano escolhido, criar a conta da proprietária e configurar banco e autenticação próprios antes da publicação. [3] |

## Recomendação técnica

Para manter o site atual funcionando imediatamente, o endereço completo publicado continua sendo a solução pronta, pois ele já possui servidor, banco de dados, autenticação e painel. Para tornar o projeto independente dessa infraestrutura, a rota mais sustentável no longo prazo é uma migração explícita para uma plataforma completa, com banco e autenticação administrados pela proprietária. Não é seguro prometer que uma modalidade gratuita externa manterá banco e servidor para sempre, porque essas modalidades possuem limites e podem mudar.

## Fontes

[1]: https://render.com/docs/free "Render — Deploy for Free"
[2]: https://developers.cloudflare.com/workers/platform/pricing/ "Cloudflare Workers — Pricing"
[3]: https://www.koyeb.com/docs/build-and-deploy/deploy-with-git "Koyeb — Deploy with GitHub"
