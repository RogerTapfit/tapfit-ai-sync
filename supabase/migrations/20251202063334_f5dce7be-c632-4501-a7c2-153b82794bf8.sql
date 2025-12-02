-- Enable realtime for water_intake table
ALTER TABLE water_intake REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE water_intake;