require('dotenv').config();
const db = require('../db');

const relations = [
  {
    table: 'bookings',
    column: 'user_id',
    parent: 'users',
    constraint: 'fk_bookings_user',
    definition: 'FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT',
  },
  {
    table: 'bookings',
    column: 'property_id',
    parent: 'properties',
    constraint: 'fk_bookings_property',
    definition: 'FOREIGN KEY (property_id) REFERENCES properties(id) ON UPDATE CASCADE ON DELETE RESTRICT',
  },
  {
    table: 'audit_logs',
    column: 'actor_id',
    parent: 'users',
    constraint: 'fk_audit_actor',
    definition: 'FOREIGN KEY (actor_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT',
  },
  {
    table: 'property_amenities',
    column: 'property_id',
    parent: 'properties',
    constraint: 'fk_property_amenities_property',
    definition: 'FOREIGN KEY (property_id) REFERENCES properties(id) ON UPDATE CASCADE ON DELETE CASCADE',
  },
  {
    table: 'group_inquiries',
    column: 'initiator_user_id',
    parent: 'users',
    constraint: 'fk_group_inquiries_initiator',
    definition: 'FOREIGN KEY (initiator_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT',
  },
  {
    table: 'group_inquiry_members',
    column: 'inquiry_id',
    parent: 'group_inquiries',
    parentColumn: 'inquiry_id',
    constraint: 'fk_group_members_inquiry',
    definition: 'FOREIGN KEY (inquiry_id) REFERENCES group_inquiries(inquiry_id) ON UPDATE CASCADE ON DELETE CASCADE',
  },
  {
    table: 'group_inquiry_members',
    column: 'user_id',
    parent: 'users',
    constraint: 'fk_group_members_user',
    definition: 'FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT',
  },
];

async function tableExists(table) {
  const [rows] = await db.query(
    'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [table],
  );
  return rows.length > 0;
}

async function columnExists(table, column) {
  const [rows] = await db.query(
    'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, column],
  );
  return rows.length > 0;
}

function splitList(value) {
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).map(item => item.trim()).filter(Boolean);
  } catch {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

async function normalizeRepeatingFields() {
  const [propertyAmenitiesExists, groupMembersExists] = await Promise.all([
    tableExists('property_amenities'),
    tableExists('group_inquiry_members'),
  ]);
  if (!propertyAmenitiesExists) {
    await db.query(`CREATE TABLE property_amenities (
      property_id VARCHAR(100) NOT NULL,
      amenity VARCHAR(100) NOT NULL,
      PRIMARY KEY (property_id, amenity)
    )`);
  }
  if (!groupMembersExists) {
    await db.query(`CREATE TABLE group_inquiry_members (
      inquiry_id VARCHAR(36) NOT NULL,
      user_id INT NOT NULL,
      PRIMARY KEY (inquiry_id, user_id)
    )`);
  }

  const hasAmenities = await columnExists('properties', 'amenities');
  const hasPropertyInquiries = await columnExists('properties', 'group_inquiries');
  const hasGroupMembers = await columnExists('group_inquiries', 'member_student_ids');
  const [users] = await db.query('SELECT id FROM users');
  const userIds = new Set(users.map(user => Number(user.id)));
  const [properties] = hasAmenities
    ? await db.query('SELECT id, amenities FROM properties')
    : [[], []];
  const [inquiries] = hasGroupMembers
    ? await db.query('SELECT inquiry_id, initiator_student_id, member_student_ids FROM group_inquiries')
    : [[], []];

  const amenitiesToInsert = [];
  for (const property of properties) {
    for (const amenity of new Set(splitList(property.amenities))) {
      if (amenity.length > 100) throw new Error(`Property ${property.id} has an amenity longer than 100 characters.`);
      amenitiesToInsert.push([property.id, amenity]);
    }
  }

  const membersToInsert = [];
  for (const inquiry of inquiries) {
    const initiatorId = Number(inquiry.initiator_student_id);
    if (!userIds.has(initiatorId)) throw new Error(`Inquiry ${inquiry.inquiry_id} has no matching initiator in users.`);
    for (const value of new Set(splitList(inquiry.member_student_ids))) {
      const studentId = Number(value);
      if (!Number.isSafeInteger(studentId) || !userIds.has(studentId)) {
        throw new Error(`Inquiry ${inquiry.inquiry_id} has a member that does not match a user account.`);
      }
      membersToInsert.push([inquiry.inquiry_id, studentId]);
    }
  }

  if (amenitiesToInsert.length) {
    await db.query('INSERT IGNORE INTO property_amenities (property_id, amenity) VALUES ?', [amenitiesToInsert]);
  }
  if (membersToInsert.length) {
    await db.query('INSERT IGNORE INTO group_inquiry_members (inquiry_id, user_id) VALUES ?', [membersToInsert]);
  }

  if (hasAmenities) await db.query('ALTER TABLE properties DROP COLUMN amenities');
  if (hasPropertyInquiries) await db.query('ALTER TABLE properties DROP COLUMN group_inquiries');
  if (hasGroupMembers) await db.query('ALTER TABLE group_inquiries DROP COLUMN member_student_ids');
  if (await columnExists('group_inquiries', 'initiator_student_id')) {
    await db.query('ALTER TABLE group_inquiries CHANGE COLUMN initiator_student_id initiator_user_id INT NOT NULL');
  }
  if (await columnExists('group_inquiry_members', 'student_id')) {
    await db.query('ALTER TABLE group_inquiry_members CHANGE COLUMN student_id user_id INT NOT NULL');
  }
}

async function main() {
  await normalizeRepeatingFields();
  for (const relation of relations) {
    const [orphans] = await db.query(
      `SELECT COUNT(*) AS count FROM \`${relation.table}\` child
       LEFT JOIN \`${relation.parent}\` parent ON parent.\`${relation.parentColumn || 'id'}\` = child.\`${relation.column}\`
       WHERE child.\`${relation.column}\` IS NOT NULL AND parent.\`${relation.parentColumn || 'id'}\` IS NULL`,
    );
    if (orphans[0].count) {
      throw new Error(
        `${relation.table}.${relation.column} contains ${orphans[0].count} orphaned row(s); reconcile them before adding database constraints.`,
      );
    }

    const [constraints] = await db.query(
      `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
       WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ?
         AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME = ? AND REFERENCED_COLUMN_NAME = ?`,
      [relation.table, relation.column, relation.parent, relation.parentColumn || 'id'],
    );
    if (!constraints.length) {
      await db.query(`ALTER TABLE \`${relation.table}\` ADD CONSTRAINT \`${relation.constraint}\` ${relation.definition}`);
    }
  }
  console.log('Repeated values are normalized and core database relationships are enforced by MySQL.');
}

main()
  .catch(error => {
    console.error('Unable to enforce core database relationships:', error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
