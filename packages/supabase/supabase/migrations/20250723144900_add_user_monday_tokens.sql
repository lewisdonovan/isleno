-- Create the user_monday_tokens table
CREATE TABLE public.user_monday_tokens (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    monday_access_token text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_monday_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT user_monday_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add comments to the table and columns
COMMENT ON TABLE public.user_monday_tokens IS 'Stores encrypted Monday.com access tokens for users.';
COMMENT ON COLUMN public.user_monday_tokens.id IS 'Unique identifier for the token record.';
COMMENT ON COLUMN public.user_monday_tokens.user_id IS 'Foreign key to the authenticated user.';
COMMENT ON COLUMN public.user_monday_tokens.monday_access_token IS 'Encrypted Monday.com access token.';
COMMENT ON COLUMN public.user_monday_tokens.created_at IS 'Timestamp when the record was created.';
COMMENT ON COLUMN public.user_monday_tokens.updated_at IS 'Timestamp when the record was last updated.';

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_monday_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow users to see their own monday tokens"
ON public.user_monday_tokens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own monday tokens"
ON public.user_monday_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own monday tokens"
ON public.user_monday_tokens
FOR UPDATE
USING (auth.uid() = user_id); 