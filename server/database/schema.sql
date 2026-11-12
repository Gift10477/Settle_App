CREATE DATABASE IF NOT EXISTS settlein_se_db;
USE settlein_se_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  student_id VARCHAR(100) NULL,
  course VARCHAR(255) DEFAULT '',
  campus VARCHAR(100) DEFAULT '',
  residence_area VARCHAR(255) DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  role VARCHAR(50) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  university_affiliation VARCHAR(255) NULL,
  campus_branch VARCHAR(255) NULL,
  year_of_study INT NULL,
  is_verified_student TINYINT(1) DEFAULT 0,
  avatar_url TEXT NULL
);

CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  price INT NOT NULL,
  location VARCHAR(255) NOT NULL,
  campus VARCHAR(100) NOT NULL,
  distance VARCHAR(255) DEFAULT 'Near Campus',
  verified TINYINT(1) DEFAULT 1,
  image TEXT NULL,
  description TEXT NULL,
  landlord VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  whatsapp VARCHAR(50) NULL,
  vacant_units INT DEFAULT 1,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  security_deposit INT NULL,
  booking_fee INT NULL,
  water_included TINYINT(1) NULL,
  wifi_included TINYINT(1) NULL,
  garbage_included TINYINT(1) NULL,
  gender_policy VARCHAR(100) NULL,
  furnishing_status VARCHAR(100) NULL,
  wifi_rating DECIMAL(2,1) NULL,
  wifi_speed_mbps INT NULL,
  has_dedicated_desk TINYINT(1) NULL,
  has_backup_generator TINYINT(1) NULL,
  quiet_hours_start VARCHAR(5) NULL,
  quiet_hours_end VARCHAR(5) NULL,
  quiet_hours_policy_enforced TINYINT(1) NULL,
  max_study_guests INT NULL,
  last_inspected_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS property_amenities (
  property_id VARCHAR(100) NOT NULL,
  amenity VARCHAR(100) NOT NULL,
  PRIMARY KEY (property_id, amenity),
  CONSTRAINT fk_property_amenities_property FOREIGN KEY (property_id) REFERENCES properties(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_inquiries (
  inquiry_id VARCHAR(36) PRIMARY KEY,
  group_id VARCHAR(255) NOT NULL,
  initiator_user_id INT NOT NULL,
  target_campus VARCHAR(100) NOT NULL,
  preferred_room_type VARCHAR(50) NOT NULL,
  max_budget_per_person_kes INT NOT NULL,
  move_in_target_date DATE NOT NULL,
  notes VARCHAR(500) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_group_inquiries_initiator FOREIGN KEY (initiator_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS group_inquiry_members (
  inquiry_id VARCHAR(36) NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (inquiry_id, user_id),
  CONSTRAINT fk_group_members_inquiry FOREIGN KEY (inquiry_id) REFERENCES group_inquiries(inquiry_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_group_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  student_id VARCHAR(100) DEFAULT '',
  property_id VARCHAR(100) NOT NULL,
  property_title VARCHAR(255) DEFAULT '',
  status VARCHAR(50) DEFAULT 'pending',
  move_in_date VARCHAR(100),
  expected_arrival_time VARCHAR(50),
  lease_start_date VARCHAR(50),
  lease_end_date VARCHAR(50),
  relocation_window_start VARCHAR(100),
  relocation_window_end VARCHAR(100),
  lease_duration VARCHAR(50) DEFAULT '1 Semester (4 months)',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_property FOREIGN KEY (property_id) REFERENCES properties(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

INSERT INTO users
  (id, name, email, course, campus, residence_area, phone, role)
VALUES
  (13, 'Tripolos', 'trip45@gmail.com',
   'Bachelor of Business Information Technology (BBIT)', 'strathmore',
   'Madaraka Estate', '0712648910', 'student')
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO properties
  (id, title, type, price, location, campus, distance, verified, image,
   description, landlord, phone, whatsapp, vacant_units,
   wifi_rating, wifi_speed_mbps, has_dedicated_desk, has_backup_generator,
   quiet_hours_start, quiet_hours_end, quiet_hours_policy_enforced,
   max_study_guests, last_inspected_at)
VALUES
  ('prop-003', 'Ngando Legacy Hall', 'Shared Apartment', 18000,
   'Ngando, Nairobi', 'ku', '0.8km · Kenyatta University', 1,
   'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
   'Premium shared apartments with city views.', 'Legacy Real Estate',
   '+254 712 000 103', '+254 712 000 103', 1,
   4.5, 50, 1, 1,
   '22:00', '06:00', 1, 4, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO properties
  (id, title, type, price, location, campus, distance, verified, image,
   description, landlord, vacant_units)
VALUES
  ('prop-004', 'Madaraka Student Nook', 'Bedsitter', 12500,
   'Madaraka, Nairobi', 'strathmore', '0.6km from Strathmore University', 1,
   'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
   'Sample listing for demonstration purposes. Compact furnished bedsitter near campus.',
   'Demo Property', 2),
  ('prop-005', 'Kahawa West Shared Homes', 'Shared Apartment', 16000,
   'Kahawa West, Nairobi', 'ku', '1.2km from Kenyatta University', 1,
   'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80',
   'Sample listing for demonstration purposes. Shared student apartment with common study space.',
   'Demo Property', 3),
  ('prop-006', 'Parklands Campus Studio', 'Studio', 22000,
   'Parklands, Nairobi', 'uon', '1.0km from University of Nairobi', 1,
   'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
   'Sample listing for demonstration purposes. Private studio apartment with kitchenette.',
   'Demo Property', 1)
ON DUPLICATE KEY UPDATE id = id;

INSERT IGNORE INTO property_amenities (property_id, amenity)
VALUES
  ('prop-003','Wi-Fi'),('prop-003','Hot Shower'),('prop-003','Balcony'),('prop-003','CCTV'),('prop-003','Gym'),
  ('prop-004','Wi-Fi'),('prop-004','Hot Shower'),('prop-004','Study Desk'),
  ('prop-005','Wi-Fi'),('prop-005','Laundry'),('prop-005','Study Lounge'),
  ('prop-006','Wi-Fi'),('prop-006','Kitchenette'),('prop-006','Security');

CREATE TABLE IF NOT EXISTS audit_logs (id INT AUTO_INCREMENT PRIMARY KEY, actor_id INT NOT NULL, action VARCHAR(100) NOT NULL, target_id VARCHAR(100) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT);
CREATE TABLE IF NOT EXISTS payments (id INT AUTO_INCREMENT PRIMARY KEY, booking_id INT NOT NULL, amount DECIMAL(12,2) NOT NULL, status VARCHAR(30) DEFAULT 'pending', reference VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (booking_id) REFERENCES bookings(id));
