# Publicação completa na Cloudflare

## Endereço

- Site completo: `https://studio-henriques.studiohenriques.workers.dev`
- Painel de acesso: `https://studio-henriques.studiohenriques.workers.dev/admin/login`

## Recursos publicados

- Cloudflare Worker `studio-henriques` com os arquivos da interface React.
- Banco D1 `studio-henriques` com as tabelas de usuárias, serviços e pedidos.
- API para catálogo, pedidos de informação, atualização de preços, status de pedidos e permissões administrativas.
- Autenticação independente por e-mail e senha, com sessão protegida por cookie HTTP-only.

## Validação inicial

Em 19 de agosto de 2026, o endereço público respondeu com `HTTP 200` após a propagação do certificado TLS. A página inicial carregou a navegação, a apresentação da Jaqueline, os filtros de categoria e os 29 serviços do catálogo carregados pelo Worker/D1.

## Primeiro acesso

O e-mail `sousaarthur213@gmail.com` é reconhecido como a administradora inicial. A proprietária deve abrir `/admin/login`, selecionar **Criar acesso** e definir uma senha com ao menos 10 caracteres. Depois disso, poderá entrar no painel e promover a conta da Jaqueline quando ela criar o próprio acesso.
