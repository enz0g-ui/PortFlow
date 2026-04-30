-- One-shot cleanup of AIS-encoded '@' padding in already-stored
-- static_ships rows. Going forward, ais-worker.cleanAisString() handles
-- this at write time.
UPDATE static_ships SET name = TRIM(REPLACE(name, '@', '')) WHERE name LIKE '%@%';
UPDATE static_ships SET callsign = TRIM(REPLACE(callsign, '@', '')) WHERE callsign LIKE '%@%';
UPDATE static_ships SET destination = TRIM(REPLACE(destination, '@', '')) WHERE destination LIKE '%@%';

UPDATE static_ships SET name = NULL WHERE name = '';
UPDATE static_ships SET callsign = NULL WHERE callsign = '';
UPDATE static_ships SET destination = NULL WHERE destination = '';
