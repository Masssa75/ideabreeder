-- Enable RLS and create policies for apis table
ALTER TABLE apis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on apis" ON apis FOR SELECT USING (true);
CREATE POLICY "Allow public insert on apis" ON apis FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on apis" ON apis FOR UPDATE USING (true);
