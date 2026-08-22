# Publicação na Cloudflare

O endereço público principal é `https://agenda.studiohenriques.workers.dev`. O repositório GitHub mantém o código e o workflow **Publicar site completo na Cloudflare** publica o Worker `agenda` com o banco D1 já vinculado.

O deploy automático ocorre em pushes para a branch `main` que alterem arquivos em `client/`, `cloudflare/`, `shared/`, `package.json`, `pnpm-lock.yaml`, `vite.cloudflare.config.ts`, `wrangler.jsonc` ou o próprio workflow. Alterações apenas em documentos e listas de tarefas não criam uma nova publicação, pois não afetam o site funcional.

Os segredos `SESSION_SECRET` e `INITIAL_ADMIN_EMAIL` pertencem ao Worker na Cloudflare e não devem ser incluídos no GitHub. Uma alteração no nome do Worker exige configurá-los novamente antes de validar o login administrativo.
