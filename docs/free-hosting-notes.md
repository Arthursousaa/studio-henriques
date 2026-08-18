# Pesquisa de hospedagem gratuita

## Render

- Documentação: https://render.com/docs/free
- O plano gratuito aceita web services Node e PostgreSQL, mas a própria Render orienta não usá-lo para produção.
- Serviços web gratuitos entram em repouso após 15 minutos sem tráfego; a reativação pode levar cerca de um minuto.
- O PostgreSQL gratuito expira 30 dias depois de criado.

## Railway

- Página de preços: https://railway.com/pricing
- O nível gratuito inicia com teste de 30 dias e US$ 5 em créditos, depois disponibiliza US$ 1 por mês.
- Assim, não representa hospedagem gratuita contínua confiável para manter o Studio Henriques completo em produção.

## Vercel Hobby

- Documentação: https://vercel.com/docs/plans/hobby
- O plano Hobby é gratuito e oferece funções com limites mensais, mas a documentação restringe o uso a projetos pessoais e não comerciais.
- Por se tratar de um site de um estúdio que atende clientes, o plano não é apropriado para esta finalidade comercial.

## Cloudflare Workers e Pages

- Documentação: https://developers.cloudflare.com/workers/platform/pricing/
- O plano gratuito inclui uso limitado de Workers e Pages Functions; a tabela da documentação indica até 100.000 requisições por dia e 10 ms de CPU por invocação para Workers gratuitos.
- Pode servir como alternativa futura de baixo tráfego, mas o projeto atual não é compatível diretamente: exigiria converter o servidor Express/tRPC, trocar o banco MySQL por uma solução compatível e refazer a autenticação e o painel. Não é uma migração de publicação simples.
