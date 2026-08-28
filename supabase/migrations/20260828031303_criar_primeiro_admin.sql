-- Garante que o módulo de criptografia do Supabase está ativado
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  novo_usuario_id UUID;
BEGIN
  -- 1. Cria o usuário no sistema de segurança do Supabase com senha criptografada
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    '5seasons.experience@gmail.com',
    extensions.crypt('brunaduz', extensions.gen_salt('bf')), -- CORREÇÃO: Apontando para o schema extensions
    now(), 
    '{"provider": "email", "providers": ["email"]}',
    '{"nome": "Bruna"}',
    now(),
    now()
  ) RETURNING id INTO novo_usuario_id;

  -- 2. Insere o administrador na nossa tabela pública para as permissões
  INSERT INTO public.admins (id, nome)
  VALUES (novo_usuario_id, 'Bruna Duz');
  
END $$;