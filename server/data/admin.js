const router = require('express').Router();
const db = require('../db');
const { requireAdmin, revokeUserSessions } = require('../middleware/session');
const { hashPassword } = require('../services/passwords');
router.use(requireAdmin);
router.post('/uploads', async (req, res, next) => {
  const { data } = req.body;
  if (typeof data !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data)) return res.status(400).json({ error: 'Choose a JPEG, PNG or WebP image' });
  const bytes = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
  const extension = bytes.subarray(0,3).equals(Buffer.from([255,216,255])) ? 'jpg' : bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png' : bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP' ? 'webp' : null;
  if (!extension || bytes.length > 5*1024*1024) return res.status(400).json({ error: 'Upload a valid image no larger than 5 MB' });
  try {
    const path = require('path');
    const fs = require('fs/promises');
    const name = require('crypto').randomUUID() + '.' + extension;
    const folder = path.join(__dirname, '../uploads');
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder,name), bytes, { flag: 'wx' });
    res.status(201).json({ url: '/data/uploads/' + name });
  } catch (error) { next(error); }
});
async function audit(connection, actor, action, target) {
  await connection.query('INSERT INTO audit_logs (actor_id, action, target_id) VALUES (?, ?, ?)', [actor, action, String(target)]);
}
router.get('/dashboard', async (req, res, next) => {
  try {
    const [properties] = await db.query('SELECT * FROM properties ORDER BY created_at DESC');
    const [bookings] = await db.query('SELECT b.*, u.name AS student_name, u.email FROM bookings b LEFT JOIN users u ON u.id=b.user_id ORDER BY b.id DESC');
    const [users] = await db.query('SELECT id, name, email, role FROM users ORDER BY id DESC');
    const [payments] = await db.query('SELECT * FROM payments ORDER BY id DESC LIMIT 100');
    const [logs] = await db.query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100');
    res.json({ properties, bookings, users, payments, logs });
  } catch (error) { next(error); }
});
router.patch('/properties/:id', async (req, res, next) => {
  const allowed = ['title','type','price','location','campus','vacant_units','description','image','verified'];
  const entries = Object.entries(req.body);
  if (!entries.length || entries.some(([key,value]) => !allowed.includes(key) || (['price','vacant_units'].includes(key) ? !Number.isInteger(value) || value < 0 : key === 'verified' ? typeof value !== 'boolean' : typeof value !== 'string' || value.length > 10000 || (!value.trim() && !['image','description'].includes(key))))) return res.status(400).json({ error: 'Invalid listing values' });
  try {
    const [result] = await db.query(`UPDATE properties SET ${entries.map(([key]) => `${key} = ?`).join(', ')} WHERE id = ?`, [...entries.map(([,value]) => value),req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Listing not found' });
    await audit(db,req.userId,'listing.updated',req.params.id);
    res.json({ message: 'Listing updated' });
  } catch(error) { next(error); }
});
router.patch('/bookings/:id', async (req,res,next) => {
  const status = req.body.status;
  if (!['approved','rejected','cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT * FROM bookings WHERE id = ? FOR UPDATE',[req.params.id]);
    const booking = rows[0];
    if (!booking) { await connection.rollback(); return res.status(404).json({ error: 'Reservation not found' }); }
    if (!(booking.status === 'pending' || (['approved','active'].includes(booking.status) && status === 'cancelled'))) { await connection.rollback(); return res.status(409).json({ error: 'Reservation already processed' }); }
    if (status === 'approved') {
      const [result] = await connection.query('UPDATE properties SET vacant_units = vacant_units - 1 WHERE id = ? AND vacant_units > 0 AND verified = 1',[booking.property_id]);
      if (!result.affectedRows) { await connection.rollback(); return res.status(409).json({ error: 'No verified vacant room remains' }); }
    }
    if (status === 'cancelled' && booking.status === 'approved') await connection.query('UPDATE properties SET vacant_units = vacant_units + 1 WHERE id = ?',[booking.property_id]);
    await connection.query('UPDATE bookings SET status = ? WHERE id = ?',[status,booking.id]);
    await audit(connection,req.userId,`reservation.${status}`,booking.id);
    await connection.commit(); res.json({ message: `Reservation ${status}` });
  } catch(error) { if(connection) await connection.rollback(); next(error); } finally { if(connection) connection.release(); }
});
router.patch('/users/:id', async (req,res,next) => {
  const { role,password } = req.body;
  if (String(req.params.id) === req.userId) return res.status(400).json({ error: 'Another administrator must change your account' });
  if ((role === undefined) === (password === undefined) || (role !== undefined && !['admin','student'].includes(role)) || (password !== undefined && (typeof password !== 'string' || password.length < 8 || password.length > 128))) return res.status(400).json({ error: 'Choose a role or password of 8-128 characters' });
  try {
    const [result] = await db.query(`UPDATE users SET ${role !== undefined ? 'role' : 'password_hash'} = ? WHERE id = ?`,[role !== undefined ? role : await hashPassword(password),req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'User not found' });
    revokeUserSessions(req.params.id);
    await audit(db,req.userId,role !== undefined ? 'user.role_changed' : 'user.password_reset',req.params.id);
    res.json({ message: 'User updated; sessions revoked' });
  } catch(error) { next(error); }
});
module.exports = router;
