PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS studio_availability_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'blocked', 'booked')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(slot_date, start_time)
);

ALTER TABLE studio_bookings ADD COLUMN availability_slot_id INTEGER REFERENCES studio_availability_slots(id);

CREATE INDEX IF NOT EXISTS idx_studio_availability_slots_date_status ON studio_availability_slots(slot_date, status, start_time);
CREATE UNIQUE INDEX IF NOT EXISTS idx_studio_bookings_availability_slot ON studio_bookings(availability_slot_id) WHERE availability_slot_id IS NOT NULL;
