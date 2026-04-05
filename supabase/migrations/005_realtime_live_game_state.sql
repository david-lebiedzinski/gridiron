-- Enable realtime subscriptions on live_game_state so the picks grid
-- auto-updates when game state changes (admin edits or ESPN sync).
alter publication supabase_realtime add table public.live_game_state;
