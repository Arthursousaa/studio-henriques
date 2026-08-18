# Hospedagem gratuita para o Studio Henriques

## Conclusão prática

Para **manter o site atual completo**, com painel administrativo, registro de pedidos de informações e banco de dados, a opção gratuita já utilizada é a mais simples: manter a publicação atual. Ela preserva o funcionamento sem que seja necessário reescrever o projeto.

Nenhuma alternativa gratuita analisada oferece, ao mesmo tempo, hospedagem contínua sem restrição importante, banco de dados durável, painel administrativo e um domínio exclusivo sem o nome da plataforma. Um endereço próprio como `studiohenriques.com.br` continua exigindo o registro do domínio.

| Alternativa | Pode manter o projeto atual sem reescrever? | Uso comercial gratuito contínuo | Limitação principal |
|---|---:|---:|---|
| Publicação atual | Sim | Depende das regras do plano da conta | O link gratuito usa `manus.space` |
| Render Free | Exigiria migração parcial | Não recomendado | Serviço hiberna e banco gratuito expira em 30 dias |
| Railway Free | Sim, com adaptação de infraestrutura | Não contínuo | Crédito de teste e apenas US$ 1 mensal depois dele |
| Vercel Hobby | Exigiria adaptação grande | Não | Plano restrito a uso pessoal e não comercial |
| Cloudflare Pages/Workers | Exigiria reescrever servidor, banco e autenticação | Possível para baixo tráfego | Migração técnica completa; o link gratuito usa `workers.dev` ou `pages.dev` |

## Recomendação

Para o Studio Henriques, recomenda-se manter a hospedagem atual enquanto a operação estiver no início e usar o GitHub como cópia do código. Caso o objetivo futuro seja remover o nome da plataforma do endereço, registre `studiohenriques.com.br`; um domínio próprio pode ser apontado para qualquer hospedagem posteriormente.

> A mudança para uma alternativa gratuita como Cloudflare é tecnicamente possível, mas não é apenas “enviar para outro lugar”: seria necessário reconstruir a camada de servidor, migrar o banco e redefinir a autenticação. Por isso, não é a melhor escolha para uma primeira publicação de um site de atendimento.

## Referências

[1] Render. [Deploy for Free](https://render.com/docs/free).

[2] Railway. [Pricing](https://railway.com/pricing).

[3] Vercel. [Hobby Plan](https://vercel.com/docs/plans/hobby).

[4] Cloudflare. [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/).
