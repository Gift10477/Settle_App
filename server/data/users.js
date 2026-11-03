const router = require('express').Router();
const db = require('../db');
const { hashPassword, verifyPassword } = require('../services/passwords');
const { issueSession, requireUser, requireOwner, revokeUserSessions } = require('../middleware/session');
const fields = ['id','name','email','student_id','course','campus','residence_area','phone','role'];
const publicUser = user => Object.fromEntries(fields.map(key => [key,user[key]]));
const emailValid = value => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
router.post('/', async (req,res,next) => {
  const { name,email,password,role = 'student',student_id = '',course = '',campus = '',residence_area = '',phone = '' } = req.body;
  if (typeof name !== 'string' || !name.trim() || name.length > 255 || !emailValid(email) || typeof password !== 'string' || password.length < 8 || password.length > 128 || !['student','landlord'].includes(role) || [student_id,course,campus,residence_area,phone].some(value => typeof value !== 'string' || value.length > 255)) return res.status(400).json({error:'Enter valid account details and a password of 8-128 characters.'});
  try {
    const [result] = await db.query('INSERT INTO users (name,email,password_hash,role,student_id,course,campus,residence_area,phone) VALUES (?,?,?,?,?,?,?,?,?)',[name.trim(),email.trim().toLowerCase(),await hashPassword(password),role,student_id,course,campus,residence_area,phone]);
    res.status(201).json({user_id:result.insertId});
  } catch(error) { if(error.code === 'ER_DUP_ENTRY') return res.status(409).json({error:'An account with this email already exists.'}); next(error); }
});
router.post('/login', async (req,res,next) => {
  const { email,password } = req.body;
  if (!emailValid(email) || typeof password !== 'string' || password.length > 128) return res.status(400).json({error:'Enter your email and password.'});
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?',[email.trim().toLowerCase()]);
    if(!rows[0] || !await verifyPassword(password,rows[0].password_hash)) return res.status(401).json({error:'Invalid email or password.'});
    res.json({user:publicUser(rows[0]),access_token:issueSession(rows[0].id)});
  } catch(error) { next(error); }
});
router.post('/logout',requireUser,(req,res) => {revokeUserSessions(req.userId);res.json({message:'Signed out.'});});
router.get('/:id',requireOwner(req=>req.params.id),async(req,res,next)=>{
  try {const [rows]=await db.query('SELECT * FROM users WHERE id = ?',[req.params.id]);if(!rows[0])return res.status(404).json({error:'Account not found.'});res.json(publicUser(rows[0]));}catch(error){next(error);}
});
router.put('/:id',requireOwner(req=>req.params.id),async(req,res,next)=>{
  const allowed=['name','email','student_id','course','campus','residence_area','phone'];
  const entries=Object.entries(req.body);
  if(!entries.length || entries.some(([key,value])=>!allowed.includes(key)||typeof value!=='string'||value.length>255||(key==='email'&&!emailValid(value))||(key==='name'&&!value.trim())))return res.status(400).json({error:'Invalid profile details.'});
  try {await db.query(`UPDATE users SET ${entries.map(([key])=>`${key} = ?`).join(', ')} WHERE id = ?`,[...entries.map(([,value])=>value),req.params.id]);res.json({message:'Profile updated.'});}catch(error){next(error);}
});
module.exports=router;
