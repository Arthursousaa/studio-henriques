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

## Verificação após publicação contínua

Após a publicação automática pelo GitHub Actions, a página pública e o catálogo foram revisados novamente no endereço do Worker. A tela de acesso independente em `/admin/login` também carregou com os campos de e-mail e senha, a ação de entrada e a opção de criação do primeiro cadastro. A validação das ações internas do painel permanece condicionada ao primeiro cadastro real da proprietária, para evitar criar contas, pedidos ou alterações fictícias em produção.

## Correção do cadastro inicial

O primeiro cadastro retornava o erro `1101` da Cloudflare porque a função de derivação de senha usava 310.000 iterações de PBKDF2, enquanto o runtime do Worker suporta até 100.000. A derivação foi ajustada para 100.000 iterações e publicada no Worker em 19 de agosto de 2026. Um cadastro técnico efêmero respondeu com `HTTP 200` após a correção e foi removido imediatamente do banco D1, sem deixar contas ou pedidos de teste na produção.

## Validação real da administradora inicial

Após a correção, a proprietária confirmou que conseguiu criar o acesso e entrar no painel com o e-mail `sousaarthur213@gmail.com`. A consulta de verificação no D1 confirmou o registro com a função `admin`, bem como a criação e o último acesso em 19 de agosto de 2026. Essa confirmação valida o fluxo publicado de criação de conta, sessão administrativa e abertura do painel sem solicitar ou registrar a senha da proprietária.
