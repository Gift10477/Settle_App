CREATE TABLE IF NOT EXISTS property_amenities (
  property_id VARCHAR(100) NOT NULL,
  amenity VARCHAR(100) NOT NULL,
  PRIMARY KEY (property_id, amenity),
  CONSTRAINT fk_property_amenities_property FOREIGN KEY (property_id) REFERENCES properties(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_inquiry_members (
  inquiry_id VARCHAR(36) NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (inquiry_id, user_id),
  CONSTRAINT fk_group_members_inquiry FOREIGN KEY (inquiry_id) REFERENCES group_inquiries(inquiry_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_group_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
