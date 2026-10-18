create table public.real_estate_properties (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,119}$'),
 draft jsonb not null,
 published jsonb,
 visibility text not null default 'draft' check (visibility in ('draft','published','hidden')),
 revision bigint not null default 1,
 deleted_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.real_estate_assets (
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.real_estate_properties(id) on delete cascade,
 kind text not null check(kind in ('image','document')),
 path text not null unique,
 name text not null,
 mime text not null,
 bytes bigint not null default 0,
 ready boolean not null default false,
 created_at timestamptz not null default now()
);
create index real_estate_assets_property_idx on public.real_estate_assets(property_id);
create table public.real_estate_versions (
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.real_estate_properties(id) on delete cascade,
 revision bigint not null,
 action text not null,
 content jsonb not null,
 created_at timestamptz not null default now(),
 unique(property_id,revision)
);
alter table public.real_estate_properties enable row level security;
alter table public.real_estate_assets enable row level security;
alter table public.real_estate_versions enable row level security;
revoke all on public.real_estate_properties, public.real_estate_assets, public.real_estate_versions from anon, authenticated;
grant all on public.real_estate_properties, public.real_estate_assets, public.real_estate_versions to service_role;

create function public.manage_real_estate_property(p_id uuid, p_revision bigint, p_action text, p_content jsonb default null)
returns public.real_estate_properties
language plpgsql security invoker set search_path = '' as $$
declare r public.real_estate_properties;
begin
 select * into r from public.real_estate_properties where id=p_id for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if r.revision <> p_revision then raise exception 'CONFLICT'; end if;
 if p_action not in ('save','publish','hide','trash','restore','restore_version') then raise exception 'INVALID_ACTION'; end if;
 if r.deleted_at is not null and p_action <> 'restore' then raise exception 'DELETED'; end if;
 if p_action in ('save','publish','restore_version') then
  if p_content is null or jsonb_typeof(p_content) <> 'object' then raise exception 'INVALID_CONTENT'; end if;
  r.draft := p_content;
 end if;
 if p_action = 'publish' then r.published := r.draft; r.visibility := 'published'; end if;
 if p_action = 'hide' then r.visibility := 'hidden'; end if;
 if p_action = 'trash' then r.deleted_at := now(); end if;
 if p_action = 'restore' then r.deleted_at := null; end if;
 update public.real_estate_properties set draft=r.draft, published=r.published, visibility=r.visibility,
 deleted_at=r.deleted_at, revision=revision+1, updated_at=now() where id=p_id returning * into r;
 insert into public.real_estate_versions(property_id,revision,action,content)
 values(r.id,r.revision,p_action,r.draft);
 return r;
end $$;
revoke all on function public.manage_real_estate_property(uuid,bigint,text,jsonb) from public, anon, authenticated;
grant execute on function public.manage_real_estate_property(uuid,bigint,text,jsonb) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('real-estate-media','real-estate-media',false,26214400,array['image/jpeg','image/png','image/webp','image/avif','image/heic','image/heif','application/pdf'])
on conflict(id) do nothing;
