-- ============================================================================
-- MIGRATION: Living Letter Feature
-- DATE: 2024-06-23
-- PURPOSE: Creates the data layer for interactive pace invitation letters.
--          A "Living Letter" is a block-based, interactive invitation letter
--          that replaces the cold invite link. Writers embed text, questions,
--          and photos. Recipients answer inline before joining the Pace.
-- ============================================================================

-- ============================================================
-- TABLE 1: letters
-- Stores the letter metadata (one per invitation letter sent)
-- ============================================================
CREATE TABLE IF NOT EXISTS letters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pace_id     UUID REFERENCES paces(id) ON DELETE CASCADE,
  sender_id   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token       TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  title       TEXT,
  mood        TEXT DEFAULT 'nostalgic',  -- nostalgic | tender | wild | electric
  mode        TEXT DEFAULT 'sealed',     -- sealed (v1 only) | chapters (v2)
  status      TEXT DEFAULT 'sent',       -- draft | sent | read | responded
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days'
);

-- ============================================================
-- TABLE 2: letter_blocks
-- Stores each content block inside a letter, ordered by index
-- ============================================================
CREATE TABLE IF NOT EXISTS letter_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id   UUID REFERENCES letters(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL,    -- text | question | photo | divider
  content     TEXT,             -- text content (for text/question blocks)
  photo_url   TEXT,             -- CDN URL (for photo blocks)
  order_index INTEGER NOT NULL, -- controls render order
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 3: letter_responses
-- Stores the recipient's answers to question blocks
-- ============================================================
CREATE TABLE IF NOT EXISTS letter_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id     UUID REFERENCES letters(id) ON DELETE CASCADE NOT NULL,
  block_id      UUID REFERENCES letter_blocks(id) ON DELETE CASCADE NOT NULL,
  respondent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  answer        TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(block_id, respondent_id)  -- one answer per block per person
);

-- ============================================================
-- INDEXES: Speed up common queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_letters_token     ON letters(token);
CREATE INDEX IF NOT EXISTS idx_letters_pace_id   ON letters(pace_id);
CREATE INDEX IF NOT EXISTS idx_letter_blocks_lid ON letter_blocks(letter_id, order_index);
CREATE INDEX IF NOT EXISTS idx_letter_resp_lid   ON letter_responses(letter_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE letters         ENABLE ROW LEVEL SECURITY;
ALTER TABLE letter_blocks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE letter_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can read letters by their public token (for invite link access)
CREATE POLICY "letters_public_select" ON letters
  FOR SELECT USING (true);

-- Only the sender can create/update their letters
CREATE POLICY "letters_sender_insert" ON letters
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "letters_sender_update" ON letters
  FOR UPDATE USING (auth.uid() = sender_id);

-- Anyone can read blocks of a letter they have the token for
CREATE POLICY "letter_blocks_public_select" ON letter_blocks
  FOR SELECT USING (true);

-- Only letter sender can create blocks
CREATE POLICY "letter_blocks_sender_insert" ON letter_blocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM letters
      WHERE letters.id = letter_id
        AND letters.sender_id = auth.uid()
    )
  );

-- Authenticated users can submit responses
CREATE POLICY "letter_responses_auth_insert" ON letter_responses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can update their responses (for upsert support)
CREATE POLICY "letter_responses_auth_update" ON letter_responses
  FOR UPDATE USING (auth.uid() = respondent_id);


-- Users can read their own responses (and sender can read all)
CREATE POLICY "letter_responses_select" ON letter_responses
  FOR SELECT USING (
    auth.uid() = respondent_id
    OR EXISTS (
      SELECT 1 FROM letters
      WHERE letters.id = letter_id
        AND letters.sender_id = auth.uid()
    )
  );

-- ============================================================
-- RPC: fetch_letter_by_token
-- Runs as SECURITY DEFINER so unauthenticated guests can read
-- letter + blocks + pace info + sender name via a single call
-- ============================================================
CREATE OR REPLACE FUNCTION fetch_letter_by_token(token_arg TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_letter  letters%ROWTYPE;
  v_blocks  JSON;
  v_pace    JSON;
  v_sender  JSON;
BEGIN
  SELECT * INTO v_letter FROM letters WHERE token = token_arg;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Fetch ordered blocks
  SELECT json_agg(b ORDER BY b.order_index) INTO v_blocks
  FROM letter_blocks b
  WHERE b.letter_id = v_letter.id;

  -- Fetch pace info
  SELECT json_build_object('id', p.id, 'title', p.title, 'cover_url', p.cover_url, 'mood', p.mood, 'description', p.description)
  INTO v_pace
  FROM paces p WHERE p.id = v_letter.pace_id;

  -- Fetch sender info
  SELECT json_build_object('display_name', pr.display_name, 'avatar_url', pr.avatar_url)
  INTO v_sender
  FROM profiles pr WHERE pr.id = v_letter.sender_id;

  RETURN json_build_object(
    'letter',  row_to_json(v_letter),
    'blocks',  COALESCE(v_blocks, '[]'::json),
    'pace',    v_pace,
    'sender',  v_sender
  );
END;
$$;
