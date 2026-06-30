
-- 1. memories
CREATE TABLE public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  occasion text DEFAULT 'father_day',
  father_name text NOT NULL,
  sender_name text NOT NULL,
  message text NOT NULL,
  music_id text,
  music_title text,
  music_artist text,
  music_cover text,
  music_preview_url text,
  payment_status text DEFAULT 'pending',
  is_unlocked boolean DEFAULT false,
  qr_code_url text,
  public_url text,
  views integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.memories TO anon;
GRANT SELECT, INSERT, UPDATE ON public.memories TO authenticated;
GRANT ALL ON public.memories TO service_role;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert memories"
  ON public.memories FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can read unlocked or pending memories"
  ON public.memories FOR SELECT TO anon, authenticated
  USING (is_unlocked = true OR payment_status = 'pending');

-- 2. memory_photos
CREATE TABLE public.memory_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid REFERENCES public.memories(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_memory_photos_memory_id ON public.memory_photos(memory_id);
GRANT SELECT, INSERT ON public.memory_photos TO anon;
GRANT SELECT, INSERT ON public.memory_photos TO authenticated;
GRANT ALL ON public.memory_photos TO service_role;
ALTER TABLE public.memory_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert memory_photos"
  ON public.memory_photos FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can read photos of unlocked or pending memories"
  ON public.memory_photos FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.memories m
    WHERE m.id = memory_photos.memory_id
      AND (m.is_unlocked = true OR m.payment_status = 'pending')
  ));

-- 3. payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid REFERENCES public.memories(id) ON DELETE CASCADE,
  provider text DEFAULT 'cakto',
  provider_payment_id text,
  amount integer DEFAULT 1390,
  currency text DEFAULT 'BRL',
  status text DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_memory_id ON public.payments(memory_id);
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
-- nenhuma policy pública: apenas service_role acessa

-- 4. memory_events
CREATE TABLE public.memory_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid REFERENCES public.memories(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_memory_events_memory_id ON public.memory_events(memory_id);
GRANT INSERT ON public.memory_events TO anon, authenticated;
GRANT ALL ON public.memory_events TO service_role;
ALTER TABLE public.memory_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert memory_events"
  ON public.memory_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_memories_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket policies (bucket é criado via tool separada)
CREATE POLICY "Public can upload memory photos"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'memory-photos');

CREATE POLICY "Public can read memory photos"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'memory-photos');
