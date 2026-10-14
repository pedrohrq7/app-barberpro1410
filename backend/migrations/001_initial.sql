CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 100),
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('cliente','barbeiro')),
  specialty TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_price INTEGER NOT NULL CHECK(base_price > 0),
  duration INTEGER NOT NULL CHECK(duration BETWEEN 5 AND 240),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1))
);

CREATE TABLE barber_services (
  barber_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
  price INTEGER NOT NULL CHECK(price > 0),
  PRIMARY KEY(barber_id, service_id)
);

CREATE TABLE barber_slots (
  barber_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
  PRIMARY KEY(barber_id, time)
);

CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  barber_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  service_name TEXT NOT NULL,
  price INTEGER NOT NULL CHECK(price > 0),
  duration INTEGER NOT NULL CHECK(duration > 0),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','concluido','cancelado')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_client_date ON appointments(client_id, date, time);
CREATE INDEX idx_appointments_barber_date ON appointments(barber_id, date, time);
