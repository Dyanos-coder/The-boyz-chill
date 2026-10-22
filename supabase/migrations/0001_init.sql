-- ============================================================
-- The Boyz : schéma initial
-- ============================================================

-- Types --------------------------------------------------------
create type vibe        as enum ('chill', 'soiree', 'bouffe', 'sport', 'gaming', 'sortie');
create type plan_status as enum ('idee', 'sondage', 'confirme', 'annule', 'termine');
create type rsvp_status as enum ('chaud', 'peut_etre', 'pas_dispo');
create type vote_answer as enum ('oui', 'si_besoin', 'non');
create type member_role as enum ('admin', 'membre');

-- Membres ------------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  pseudo      text unique check (char_length(pseudo) between 2 and 24),
  avatar_url  text,
  color       text not null default 'chill'
              check (color in ('chill', 'soiree', 'bouffe', 'sport', 'gaming', 'sortie')),
  created_at  timestamptz not null default now()
);

-- Groupes ------------------------------------------------------
create table groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 2 and 40),
  invite_code  text not null unique
               default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  created_by   uuid not null references profiles (id),
  created_at   timestamptz not null default now()
);

create table group_members (
  group_id   uuid not null references groups on delete cascade,
  user_id    uuid not null references profiles on delete cascade,
  role       member_role not null default 'membre',
  joined_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index on group_members (user_id);

-- Plans --------------------------------------------------------
create table plans (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid not null references groups on delete cascade,
  created_by     uuid not null references profiles (id),
  title          text not null check (char_length(title) between 2 and 80),
  description    text check (char_length(description) <= 2000),
  vibe           vibe not null default 'chill',
  status         plan_status not null default 'idee',
  starts_at      timestamptz,
  ends_at        timestamptz,
  place_name     text,
  place_address  text,
  lat            double precision,
  lng            double precision,
  max_people     int check (max_people > 0),
  cover_path     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at),
  check (status <> 'confirme' or starts_at is not null)  -- un plan confirmé a une date
);
create index on plans (group_id, starts_at);

create table plan_rsvps (
  plan_id     uuid not null references plans on delete cascade,
  user_id     uuid not null references profiles on delete cascade,
  status      rsvp_status not null,
  note        text check (char_length(note) <= 140),
  updated_at  timestamptz not null default now(),
  primary key (plan_id, user_id)
);

-- Sondage de date ----------------------------------------------
create table date_options (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references plans on delete cascade,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  created_by  uuid not null references profiles (id),
  created_at  timestamptz not null default now(),
  unique (plan_id, starts_at)
);

create table date_votes (
  option_id  uuid not null references date_options on delete cascade,
  user_id    uuid not null references profiles on delete cascade,
  answer     vote_answer not null,
  voted_at   timestamptz not null default now(),
  primary key (option_id, user_id)
);

-- Qui ramène quoi ----------------------------------------------
create table plan_items (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references plans on delete cascade,
  label        text not null check (char_length(label) between 1 and 60),
  quantity     int not null default 1 check (quantity > 0),
  assigned_to  uuid references profiles on delete set null,
  done         boolean not null default false,
  created_by   uuid not null references profiles (id),
  created_at   timestamptz not null default now()
);
create index on plan_items (plan_id);

-- Cagnotte -----------------------------------------------------
create table expenses (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references plans on delete cascade,
  paid_by       uuid not null references profiles (id),
  label         text not null check (char_length(label) between 1 and 60),
  amount_cents  int not null check (amount_cents > 0),
  created_at    timestamptz not null default now()
);
create index on expenses (plan_id);

create table expense_shares (
  expense_id    uuid not null references expenses on delete cascade,
  user_id       uuid not null references profiles on delete cascade,
  amount_cents  int not null check (amount_cents >= 0),
  settled_at    timestamptz,
  primary key (expense_id, user_id)
);

-- Discussion et photos -----------------------------------------
create table messages (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references plans on delete cascade,
  user_id     uuid not null references profiles on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);
create index on messages (plan_id, created_at);

create table photos (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references plans on delete cascade,
  user_id       uuid not null references profiles on delete cascade,
  storage_path  text not null unique,
  created_at    timestamptz not null default now()
);

-- Notifications ------------------------------------------------
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles on delete cascade,
  kind        text not null check (kind in
                ('plan_cree', 'plan_modifie', 'plan_annule', 'rappel', 'sondage', 'message', 'cagnotte')),
  plan_id     uuid references plans on delete cascade,
  payload     jsonb not null default '{}',
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index on notifications (user_id, created_at desc);

-- Vue avec compteurs -------------------------------------------
create view plan_summary with (security_invoker = true) as
select
  p.*,
  count(r.user_id) filter (where r.status = 'chaud')     as nb_chauds,
  count(r.user_id) filter (where r.status = 'peut_etre') as nb_peut_etre,
  count(r.user_id) filter (where r.status = 'pas_dispo') as nb_pas_dispo
from plans p
left join plan_rsvps r on r.plan_id = p.id
group by p.id;

-- ============================================================
-- Fonctions et triggers
-- ============================================================

create function is_member(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = g and user_id = auth.uid());
$$;

create function is_admin(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members
                 where group_id = g and user_id = auth.uid() and role = 'admin');
$$;

create function plan_group(p uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select group_id from plans where id = p;
$$;

create function shares_group(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_members a
    join group_members b on b.group_id = a.group_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

-- Profil créé à l'inscription
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, pseudo, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'pseudo', new.raw_user_meta_data ->> 'avatar_url');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Créer un groupe : le créateur en devient admin
create function create_group(group_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare g uuid;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise';
  end if;
  insert into groups (name, created_by) values (trim(group_name), auth.uid()) returning id into g;
  insert into group_members (group_id, user_id, role) values (g, auth.uid(), 'admin');
  return g;
end $$;

-- Rejoindre un groupe avec un code d'invitation
create function join_group(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare g uuid;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise';
  end if;
  select id into g from groups where invite_code = lower(trim(code));
  if g is null then
    raise exception 'Code d''invitation inconnu';
  end if;
  insert into group_members (group_id, user_id) values (g, auth.uid())
  on conflict do nothing;
  return g;
end $$;

-- Aperçu d'une invitation (nom du groupe, nombre de membres) avant de rejoindre
create function invite_preview(code text)
returns table (name text, members bigint)
language sql stable security definer set search_path = public as $$
  select g.name, count(m.user_id)
  from groups g
  left join group_members m on m.group_id = g.id
  where g.invite_code = lower(trim(code))
  group by g.id;
$$;

revoke execute on function create_group(text), join_group(text), invite_preview(text) from anon, public;
grant execute on function create_group(text), join_group(text), invite_preview(text) to authenticated;

-- updated_at automatique
create function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger plans_touch      before update on plans      for each row execute function touch_updated_at();
create trigger plan_rsvps_touch before update on plan_rsvps for each row execute function touch_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles        enable row level security;
alter table groups          enable row level security;
alter table group_members   enable row level security;
alter table plans           enable row level security;
alter table plan_rsvps      enable row level security;
alter table date_options    enable row level security;
alter table date_votes      enable row level security;
alter table plan_items      enable row level security;
alter table expenses        enable row level security;
alter table expense_shares  enable row level security;
alter table messages        enable row level security;
alter table photos          enable row level security;
alter table notifications   enable row level security;

-- profiles
create policy "voir soi et ses potes" on profiles for select
  using (id = auth.uid() or shares_group(id));
create policy "modifier son profil" on profiles for update
  using (id = auth.uid());

-- groups
create policy "voir ses groupes" on groups for select
  using (is_member(id));
create policy "admin modifie le groupe" on groups for update
  using (is_admin(id));

-- group_members (l'ajout passe par create_group et join_group)
create policy "voir les membres" on group_members for select
  using (is_member(group_id));
create policy "quitter ou retirer" on group_members for delete
  using (user_id = auth.uid() or is_admin(group_id));
create policy "admin change les rôles" on group_members for update
  using (is_admin(group_id));

-- plans
create policy "voir les plans du groupe" on plans for select
  using (is_member(group_id));
create policy "lancer un plan" on plans for insert
  with check (is_member(group_id) and created_by = auth.uid());
create policy "créateur ou admin modifie" on plans for update
  using (created_by = auth.uid() or is_admin(group_id));
create policy "créateur ou admin supprime" on plans for delete
  using (created_by = auth.uid() or is_admin(group_id));

-- plan_rsvps
create policy "voir les réponses" on plan_rsvps for select
  using (is_member(plan_group(plan_id)));
create policy "répondre pour soi" on plan_rsvps for insert
  with check (user_id = auth.uid() and is_member(plan_group(plan_id)));
create policy "changer sa réponse" on plan_rsvps for update
  using (user_id = auth.uid());
create policy "retirer sa réponse" on plan_rsvps for delete
  using (user_id = auth.uid());

-- date_options
create policy "voir les dates proposées" on date_options for select
  using (is_member(plan_group(plan_id)));
create policy "proposer une date" on date_options for insert
  with check (created_by = auth.uid() and is_member(plan_group(plan_id)));
create policy "retirer sa date" on date_options for delete
  using (created_by = auth.uid());

-- date_votes
create policy "voir les votes" on date_votes for select
  using (exists (select 1 from date_options o
                 where o.id = option_id and is_member(plan_group(o.plan_id))));
create policy "voter pour soi" on date_votes for insert
  with check (user_id = auth.uid() and exists (select 1 from date_options o
              where o.id = option_id and is_member(plan_group(o.plan_id))));
create policy "changer son vote" on date_votes for update
  using (user_id = auth.uid());
create policy "retirer son vote" on date_votes for delete
  using (user_id = auth.uid());

-- plan_items : tout membre du groupe peut ajouter, prendre, cocher
create policy "voir la liste" on plan_items for select
  using (is_member(plan_group(plan_id)));
create policy "ajouter un truc" on plan_items for insert
  with check (created_by = auth.uid() and is_member(plan_group(plan_id)));
create policy "prendre ou cocher" on plan_items for update
  using (is_member(plan_group(plan_id)));
create policy "supprimer son truc" on plan_items for delete
  using (created_by = auth.uid());

-- expenses
create policy "voir les dépenses" on expenses for select
  using (is_member(plan_group(plan_id)));
create policy "ajouter une dépense payée par soi" on expenses for insert
  with check (paid_by = auth.uid() and is_member(plan_group(plan_id)));
create policy "modifier sa dépense" on expenses for update
  using (paid_by = auth.uid());
create policy "supprimer sa dépense" on expenses for delete
  using (paid_by = auth.uid());

-- expense_shares : gérées par celui qui a payé
create policy "voir les parts" on expense_shares for select
  using (exists (select 1 from expenses e
                 where e.id = expense_id and is_member(plan_group(e.plan_id))));
create policy "payeur répartit" on expense_shares for all
  using (exists (select 1 from expenses e where e.id = expense_id and e.paid_by = auth.uid()))
  with check (exists (select 1 from expenses e where e.id = expense_id and e.paid_by = auth.uid()));

-- messages
create policy "lire la discussion" on messages for select
  using (is_member(plan_group(plan_id)));
create policy "écrire en son nom" on messages for insert
  with check (user_id = auth.uid() and is_member(plan_group(plan_id)));
create policy "supprimer son message" on messages for delete
  using (user_id = auth.uid());

-- photos
create policy "voir les photos" on photos for select
  using (is_member(plan_group(plan_id)));
create policy "ajouter ses photos" on photos for insert
  with check (user_id = auth.uid() and is_member(plan_group(plan_id)));
create policy "supprimer ses photos" on photos for delete
  using (user_id = auth.uid());

-- notifications : chacun ne voit que les siennes
create policy "mes notifs" on notifications for select
  using (user_id = auth.uid());
create policy "marquer comme lu" on notifications for update
  using (user_id = auth.uid());

-- ============================================================
-- Temps réel et stockage
-- ============================================================

alter publication supabase_realtime add table plans, plan_rsvps, date_votes, plan_items, messages;

insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('plan-photos', 'plan-photos', false);

create policy "avatar : chacun le sien" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos : membres du groupe lisent" on storage.objects for select
  using (bucket_id = 'plan-photos' and is_member(((storage.foldername(name))[1])::uuid));

create policy "photos : membres du groupe ajoutent" on storage.objects for insert
  with check (bucket_id = 'plan-photos' and is_member(((storage.foldername(name))[1])::uuid));
