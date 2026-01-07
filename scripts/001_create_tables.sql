-- Criar tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela de perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para perfis
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Criar tabela de dívidas/compras parceladas
CREATE TABLE IF NOT EXISTS public.dividas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor TEXT NOT NULL,
  produto TEXT NOT NULL,
  loja TEXT NOT NULL,
  data_fatura DATE NOT NULL,
  total_parcelas INTEGER NOT NULL CHECK (total_parcelas > 0),
  parcelas_pagas INTEGER NOT NULL DEFAULT 0 CHECK (parcelas_pagas >= 0),
  valor_parcela DECIMAL(10, 2) NOT NULL CHECK (valor_parcela > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir consistência: parcelas pagas nunca pode ultrapassar total de parcelas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'dividas_parcelas_pagas_lte_total'
  ) THEN
    ALTER TABLE public.dividas
      ADD CONSTRAINT dividas_parcelas_pagas_lte_total
      CHECK (parcelas_pagas <= total_parcelas);
  END IF;
END $$;

-- Habilitar RLS na tabela de dívidas
ALTER TABLE public.dividas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para dívidas - usuários podem ver e gerenciar suas próprias dívidas
DROP POLICY IF EXISTS "dividas_select_own" ON public.dividas;
DROP POLICY IF EXISTS "dividas_insert_own" ON public.dividas;
DROP POLICY IF EXISTS "dividas_update_own" ON public.dividas;
DROP POLICY IF EXISTS "dividas_delete_own" ON public.dividas;

CREATE POLICY "dividas_select_own"
  ON public.dividas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "dividas_insert_own"
  ON public.dividas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dividas_update_own"
  ON public.dividas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dividas_delete_own"
  ON public.dividas FOR DELETE
  USING (auth.uid() = user_id);

-- Índices úteis (melhoram listagens por usuário/ordenação por data)
CREATE INDEX IF NOT EXISTS dividas_user_id_idx ON public.dividas (user_id);
CREATE INDEX IF NOT EXISTS dividas_user_id_data_fatura_idx ON public.dividas (user_id, data_fatura DESC);

-- Criar função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_dividas_updated_at
  BEFORE UPDATE ON public.dividas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Criar função para criar perfil automaticamente ao registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'nome', 'Usuário'),
    new.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Criar trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
