-- ============================================================
-- Migration: Organize Birthday Module
-- Date: 2026-04-14
-- Description: Creates tables for the friend pre-register, 
--   gift events, gift options, organizers, invitations, and 
--   change requests for the "Organizar Cumpleaños" feature.
-- ============================================================

-- 1. friend_preregisters
CREATE TABLE IF NOT EXISTS friend_preregisters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    birthday_day INT CHECK (birthday_day BETWEEN 1 AND 31),
    birthday_month INT CHECK (birthday_month BETWEEN 1 AND 12),
    estimated_next_age INT CHECK (estimated_next_age BETWEEN 1 AND 120),
    estimated_birth_year INT,
    linked_profile_id UUID REFERENCES profiles(id),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'invited', 'validated', 'linked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. gift_events
CREATE TABLE IF NOT EXISTS gift_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    friend_preregister_id UUID REFERENCES friend_preregisters(id) ON DELETE SET NULL,
    birthday_profile_id UUID REFERENCES profiles(id),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN (
            'draft', 'invitation_sent', 'pending_validation', 'validated',
            'gift_pending_approval', 'gift_change_requested',
            'active', 'collecting', 'completed',
            'invitation_expired', 'cancelled'
        )),
    surprise_mode BOOLEAN,
    invitation_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    invitation_sent_at TIMESTAMPTZ,
    invitation_accepted_at TIMESTAMPTZ,
    validated_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    forced_activation BOOLEAN DEFAULT FALSE,
    estimated_budget NUMERIC,
    estimated_contributors INT,
    estimated_per_person NUMERIC,
    gift_change_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. gift_options
CREATE TABLE IF NOT EXISTS gift_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_event_id UUID NOT NULL REFERENCES gift_events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC,
    category TEXT,
    product_url TEXT,
    product_image_url TEXT,
    gift_type TEXT NOT NULL DEFAULT 'contribution'
        CHECK (gift_type IN ('concrete', 'contribution', 'group_experience')),
    status TEXT NOT NULL DEFAULT 'proposed'
        CHECK (status IN ('proposed', 'approved', 'rejected', 'replaced')),
    proposed_by UUID NOT NULL REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. event_organizers
CREATE TABLE IF NOT EXISTS event_organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_event_id UUID NOT NULL REFERENCES gift_events(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id),
    role TEXT NOT NULL CHECK (role IN ('primary', 'secondary')),
    group_label TEXT,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'pending_approval', 'rejected', 'removed')),
    invited_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(gift_event_id, profile_id)
);

-- 5. event_invitations
CREATE TABLE IF NOT EXISTS event_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_event_id UUID NOT NULL REFERENCES gift_events(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'tiktok', 'linkedin', 'link_copy')),
    sent_to TEXT,
    sent_by UUID NOT NULL REFERENCES profiles(id),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    opened_at TIMESTAMPTZ
);

-- 6. gift_change_requests
CREATE TABLE IF NOT EXISTS gift_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_event_id UUID NOT NULL REFERENCES gift_events(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES profiles(id),
    message TEXT,
    original_option_id UUID REFERENCES gift_options(id),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'resolved', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_friend_preregisters_created_by ON friend_preregisters(created_by);
CREATE INDEX IF NOT EXISTS idx_gift_events_status ON gift_events(status);
CREATE INDEX IF NOT EXISTS idx_gift_events_invitation_token ON gift_events(invitation_token);
CREATE INDEX IF NOT EXISTS idx_gift_events_friend_preregister ON gift_events(friend_preregister_id);
CREATE INDEX IF NOT EXISTS idx_gift_options_event ON gift_options(gift_event_id);
CREATE INDEX IF NOT EXISTS idx_event_organizers_event ON event_organizers(gift_event_id);
CREATE INDEX IF NOT EXISTS idx_event_organizers_profile ON event_organizers(profile_id);

-- RLS
ALTER TABLE friend_preregisters ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_change_requests ENABLE ROW LEVEL SECURITY;

-- Policies: friend_preregisters
CREATE POLICY fp_select ON friend_preregisters FOR SELECT USING (created_by = auth.uid());
CREATE POLICY fp_insert ON friend_preregisters FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY fp_update ON friend_preregisters FOR UPDATE USING (created_by = auth.uid());

-- Policies: gift_events (organizers can see/edit)
CREATE POLICY ge_select ON gift_events FOR SELECT USING (
    id IN (SELECT gift_event_id FROM event_organizers WHERE profile_id = auth.uid())
    OR birthday_profile_id = auth.uid()
);
CREATE POLICY ge_insert ON gift_events FOR INSERT WITH CHECK (true);
CREATE POLICY ge_update ON gift_events FOR UPDATE USING (
    id IN (SELECT gift_event_id FROM event_organizers WHERE profile_id = auth.uid() AND role = 'primary')
    OR birthday_profile_id = auth.uid()
);

-- Policies: gift_options
CREATE POLICY go_select ON gift_options FOR SELECT USING (
    gift_event_id IN (SELECT gift_event_id FROM event_organizers WHERE profile_id = auth.uid())
    OR gift_event_id IN (SELECT id FROM gift_events WHERE birthday_profile_id = auth.uid())
);
CREATE POLICY go_insert ON gift_options FOR INSERT WITH CHECK (proposed_by = auth.uid());
CREATE POLICY go_update ON gift_options FOR UPDATE USING (
    proposed_by = auth.uid()
    OR gift_event_id IN (SELECT id FROM gift_events WHERE birthday_profile_id = auth.uid())
);

-- Policies: event_organizers
CREATE POLICY eo_select ON event_organizers FOR SELECT USING (
    gift_event_id IN (SELECT gift_event_id FROM event_organizers eo2 WHERE eo2.profile_id = auth.uid())
);
CREATE POLICY eo_insert ON event_organizers FOR INSERT WITH CHECK (profile_id = auth.uid() OR invited_by = auth.uid());
CREATE POLICY eo_update ON event_organizers FOR UPDATE USING (
    gift_event_id IN (SELECT gift_event_id FROM event_organizers eo2 WHERE eo2.profile_id = auth.uid() AND eo2.role = 'primary')
);

-- Policies: event_invitations
CREATE POLICY ei_select ON event_invitations FOR SELECT USING (sent_by = auth.uid());
CREATE POLICY ei_insert ON event_invitations FOR INSERT WITH CHECK (sent_by = auth.uid());

-- Policies: gift_change_requests
CREATE POLICY gcr_select ON gift_change_requests FOR SELECT USING (
    requested_by = auth.uid()
    OR gift_event_id IN (SELECT gift_event_id FROM event_organizers WHERE profile_id = auth.uid())
);
CREATE POLICY gcr_insert ON gift_change_requests FOR INSERT WITH CHECK (requested_by = auth.uid());

-- Public access for invitation token lookup (birthday person landing)
CREATE POLICY ge_public_token ON gift_events FOR SELECT USING (true);
