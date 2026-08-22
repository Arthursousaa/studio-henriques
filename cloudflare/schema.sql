PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  open_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_signed_in TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS studio_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  is_price_on_request INTEGER NOT NULL DEFAULT 0 CHECK (is_price_on_request IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS studio_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL,
  availability_slot_id INTEGER,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  notes TEXT,
  scheduled_at TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled')),
  confirmation_token TEXT UNIQUE,
  confirmation_status TEXT NOT NULL DEFAULT 'not_requested' CHECK (confirmation_status IN ('not_requested', 'awaiting_customer', 'sending', 'sent', 'failed')),
  confirmation_sent_at TEXT,
  confirmation_message_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES studio_services(id),
  FOREIGN KEY (availability_slot_id) REFERENCES studio_availability_slots(id)
);

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

CREATE TABLE IF NOT EXISTS studio_closed_dates (
  slot_date TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_studio_bookings_created_at ON studio_bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_studio_bookings_confirmation_status ON studio_bookings(confirmation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_studio_services_active_order ON studio_services(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_studio_availability_slots_date_status ON studio_availability_slots(slot_date, status, start_time);
CREATE UNIQUE INDEX IF NOT EXISTS idx_studio_bookings_availability_slot ON studio_bookings(availability_slot_id) WHERE availability_slot_id IS NOT NULL;
