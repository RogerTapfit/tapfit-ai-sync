-- Update avatar genders for ElevenLabs voice mapping

-- Set female avatars
UPDATE avatars 
SET gender = 'female' 
WHERE id IN (
  'dd728a36-feb1-449c-9b65-d8e09b6f17d8',  -- Tails
  'd34481a8-f552-4292-b1f5-f531ba8e37cb'   -- Tygrus
);

-- Set male avatars
UPDATE avatars 
SET gender = 'male' 
WHERE id IN (
  '2b1b5087-d661-49aa-83b8-40e89ea5afd1',  -- Stark
  '98200741-5b4d-40aa-98b9-f2ed331a929a',  -- Petrie
  '83054791-f1d8-41fa-9465-e0ce56e1d390'   -- Night Hawk
);

-- All other avatars remain neutral (default)