-- =====================================================================
-- BRASIL UNITV — banco do painel admin (Supabase)
-- Cole TUDO no Supabase: SQL Editor → New query → Run
-- Pode rodar de novo sem problema (não apaga dados).
-- =====================================================================

-- 1) VISITAS DO SITE ----------------------------------------------------
create table if not exists public.visitas (
  id           bigserial primary key,
  criado_em    timestamptz not null default now(),
  pagina       text not null,          -- ex.: /  ou  /blog/dicas-para-tv-nao-travar-no-wifi.html
  referencia   text,                   -- de onde a pessoa veio (Google, Instagram, WhatsApp…)
  dispositivo  text,                   -- celular | computador
  visitante    text                    -- código anônimo do navegador (conta pessoas únicas)
);
create index if not exists visitas_criado_em_idx on public.visitas (criado_em);
alter table public.visitas enable row level security;

drop policy if exists "site registra visita" on public.visitas;
create policy "site registra visita" on public.visitas
  for insert to anon, authenticated
  with check (char_length(pagina) <= 300 and coalesce(char_length(referencia),0) <= 300);

drop policy if exists "admin le visitas" on public.visitas;
create policy "admin le visitas" on public.visitas
  for select to authenticated using (true);

-- 2) ARTIGOS DO BLOG -----------------------------------------------------
create table if not exists public.artigos (
  id             bigserial primary key,
  slug           text not null unique,
  titulo         text not null,
  resumo         text,
  categoria      text not null default 'Dicas',
  imagem         text,
  conteudo       text not null default '',
  tempo_leitura  int  not null default 4,
  publicado      boolean not null default true,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);
alter table public.artigos enable row level security;

drop policy if exists "publico le artigos publicados" on public.artigos;
create policy "publico le artigos publicados" on public.artigos
  for select to anon using (publicado = true);

drop policy if exists "admin gerencia artigos" on public.artigos;
create policy "admin gerencia artigos" on public.artigos
  for all to authenticated using (true) with check (true);

-- 3) RESUMOS PARA O PAINEL ----------------------------------------------
create or replace function public.resumo_visitas(dias int default 30)
returns table (pagina text, visitas bigint, pessoas bigint)
language sql stable security invoker as $$
  select pagina, count(*), count(distinct visitante)
  from public.visitas
  where criado_em > now() - make_interval(days => dias)
  group by pagina order by 2 desc
$$;

create or replace function public.visitas_por_dia(dias int default 30)
returns table (dia date, visitas bigint, pessoas bigint)
language sql stable security invoker as $$
  select (criado_em at time zone 'America/Sao_Paulo')::date, count(*), count(distinct visitante)
  from public.visitas
  where criado_em > now() - make_interval(days => dias)
  group by 1 order by 1
$$;

create or replace function public.origem_visitas(dias int default 30)
returns table (origem text, visitas bigint)
language sql stable security invoker as $$
  select coalesce(nullif(referencia,''),'Direto / WhatsApp'), count(*)
  from public.visitas
  where criado_em > now() - make_interval(days => dias)
  group by 1 order by 2 desc limit 10
$$;

revoke execute on function public.resumo_visitas(int)  from public, anon;
revoke execute on function public.visitas_por_dia(int) from public, anon;
revoke execute on function public.origem_visitas(int)  from public, anon;
grant  execute on function public.resumo_visitas(int)  to authenticated;
grant  execute on function public.visitas_por_dia(int) to authenticated;
grant  execute on function public.origem_visitas(int)  to authenticated;

-- 4) IMAGENS DOS ARTIGOS (Storage) --------------------------------------
insert into storage.buckets (id, name, public)
values ('blog', 'blog', true)
on conflict (id) do nothing;

drop policy if exists "admin envia imagens"  on storage.objects;
drop policy if exists "admin troca imagens"  on storage.objects;
drop policy if exists "admin apaga imagens"  on storage.objects;
create policy "admin envia imagens" on storage.objects for insert to authenticated with check (bucket_id = 'blog');
create policy "admin troca imagens" on storage.objects for update to authenticated using (bucket_id = 'blog');
create policy "admin apaga imagens" on storage.objects for delete to authenticated using (bucket_id = 'blog');
