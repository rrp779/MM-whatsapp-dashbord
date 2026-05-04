drop extension if exists "pg_net";


  create table "public"."contacts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "phone_number" character varying(20) not null,
    "name" character varying(100),
    "profile_pic_url" text,
    "first_message_at" timestamp without time zone default now(),
    "last_message_at" timestamp without time zone default now(),
    "unread_count" integer default 0,
    "is_archived" boolean default false,
    "last_message" text
      );


alter table "public"."contacts" enable row level security;


  create table "public"."messages" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "contact_id" uuid,
    "message_id" character varying(100),
    "direction" character varying(10),
    "message_type" character varying(20) default 'text'::character varying,
    "content" text,
    "media_url" text,
    "status" character varying(20) default 'sent'::character varying,
    "timestamp" timestamp without time zone,
    "created_at" timestamp without time zone default now()
      );


alter table "public"."messages" enable row level security;


  create table "public"."users" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "email" character varying(255),
    "password_hash" text,
    "phone_number" character varying(20) not null,
    "name" character varying(100),
    "whatsapp_business_account_id" character varying(50),
    "access_token" text,
    "webhook_verify_token" character varying(100),
    "subscription_tier" character varying(20) default 'free'::character varying,
    "created_at" timestamp without time zone default now(),
    "last_active" timestamp without time zone default now(),
    "phone_number_id" text
      );


CREATE UNIQUE INDEX contacts_pkey ON public.contacts USING btree (id);

CREATE UNIQUE INDEX contacts_user_id_phone_number_key ON public.contacts USING btree (user_id, phone_number);

CREATE INDEX idx_contacts_user_last_message ON public.contacts USING btree (user_id, last_message_at DESC);

CREATE INDEX idx_messages_user_contact_time ON public.messages USING btree (user_id, contact_id, "timestamp" DESC);

CREATE UNIQUE INDEX messages_message_id_key ON public.messages USING btree (message_id);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_phone_number_key ON public.users USING btree (phone_number);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."contacts" add constraint "contacts_pkey" PRIMARY KEY using index "contacts_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."contacts" add constraint "contacts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."contacts" validate constraint "contacts_user_id_fkey";

alter table "public"."contacts" add constraint "contacts_user_id_phone_number_key" UNIQUE using index "contacts_user_id_phone_number_key";

alter table "public"."messages" add constraint "messages_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_contact_id_fkey";

alter table "public"."messages" add constraint "messages_direction_check" CHECK (((direction)::text = ANY ((ARRAY['inbound'::character varying, 'outbound'::character varying])::text[]))) not valid;

alter table "public"."messages" validate constraint "messages_direction_check";

alter table "public"."messages" add constraint "messages_message_id_key" UNIQUE using index "messages_message_id_key";

alter table "public"."messages" add constraint "messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_user_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_phone_number_key" UNIQUE using index "users_phone_number_key";

grant delete on table "public"."contacts" to "anon";

grant insert on table "public"."contacts" to "anon";

grant references on table "public"."contacts" to "anon";

grant select on table "public"."contacts" to "anon";

grant trigger on table "public"."contacts" to "anon";

grant truncate on table "public"."contacts" to "anon";

grant update on table "public"."contacts" to "anon";

grant delete on table "public"."contacts" to "authenticated";

grant insert on table "public"."contacts" to "authenticated";

grant references on table "public"."contacts" to "authenticated";

grant select on table "public"."contacts" to "authenticated";

grant trigger on table "public"."contacts" to "authenticated";

grant truncate on table "public"."contacts" to "authenticated";

grant update on table "public"."contacts" to "authenticated";

grant delete on table "public"."contacts" to "service_role";

grant insert on table "public"."contacts" to "service_role";

grant references on table "public"."contacts" to "service_role";

grant select on table "public"."contacts" to "service_role";

grant trigger on table "public"."contacts" to "service_role";

grant truncate on table "public"."contacts" to "service_role";

grant update on table "public"."contacts" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


  create policy "Enable read access for all users"
  on "public"."contacts"
  as permissive
  for select
  to public
using (true);



  create policy "Enable read access for all users"
  on "public"."messages"
  as permissive
  for select
  to public
using (true);



