create extension if not exists pg_net with schema extensions;

create or replace function public.notify_campaign_trial_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_email text;
  v_member_email text;
  v_token text;
  v_headers jsonb;
begin
  if new.status <> 'trialing' or new.environment <> 'live' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'trialing' then
    return new;
  end if;

  begin
    select decrypted_secret into v_token
    from vault.decrypted_secrets
    where name = 'campaign_webhook_token'
    limit 1;

    if v_token is null then
      raise warning 'notify_campaign_trial_signup: campaign_webhook_token missing';
      return new;
    end if;

    v_headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_token
    );

    select u.email into v_owner_email
    from public.organizations o
    join auth.users u on u.id = o.owner_id
    where o.id = new.organization_id;

    if v_owner_email is not null then
      perform net.http_post(
        url := 'https://quyzjaooflmgapqrspoy.supabase.co/functions/v1/trial-signup-webhook',
        headers := v_headers,
        body := jsonb_build_object('email', v_owner_email, 'organization_id', new.organization_id)
      );
    end if;

    for v_member_email in
      select u.email
      from public.profiles p
      join auth.users u on u.id = p.id
      where p.organization_id = new.organization_id
    loop
      if v_member_email is distinct from v_owner_email then
        perform net.http_post(
          url := 'https://quyzjaooflmgapqrspoy.supabase.co/functions/v1/trial-signup-webhook',
          headers := v_headers,
          body := jsonb_build_object('email', v_member_email, 'organization_id', new.organization_id)
        );
      end if;
    end loop;
  exception when others then
    raise warning 'notify_campaign_trial_signup failed (subscription write preserved): %', sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists trg_notify_campaign_trial_signup on public.subscriptions;

create trigger trg_notify_campaign_trial_signup
  after insert or update of status on public.subscriptions
  for each row
  execute function public.notify_campaign_trial_signup();