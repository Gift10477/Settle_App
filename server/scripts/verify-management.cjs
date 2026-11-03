// Exercises the real Express routes against the isolated MySQL copy.
require('dotenv').config({quiet:true});
const assert=require('node:assert/strict');
const crypto=require('crypto');
const request=require('supertest');
const db=require('../db');
const {hashPassword}=require('../services/passwords');
const app=require('../app');
async function main(){
 const suffix=crypto.randomBytes(8).toString('hex'),password=crypto.randomBytes(20).toString('hex');
 let property='verify-'+suffix;
 const ids=[];
 try{
  for(const role of ['admin','student']){
   const [r]=await db.query('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)',['Verification '+role,role+suffix+'@example.test',await hashPassword(password),role]);ids.push(r.insertId);
  }
  const login=async(role)=>{const r=await request(app).post('/data/users/login').send({email:role+suffix+'@example.test',password});assert.equal(r.status,200);return r.body.access_token;};
  const admin=await login('admin'),student=await login('student');
  const call=(method,url,token,body)=>{let r=request(app)[method](url).auth(token,{type:'bearer'});return body?r.send(body):r;};
  assert.equal((await call('get','/data/admin/dashboard',student)).status,403);
  const created=await call('post','/data/properties',admin,{title:'Verification room',type:'Bedsitter',price:10000,location:'Madaraka',campus:'strathmore',vacant_units:1,description:''});
  assert.equal(created.status,201);
  property=created.body.property.id;
  assert.equal(created.body.property.verified,false);
  assert.equal((await call('patch','/data/admin/properties/'+property,admin,{verified:true})).status,200);
  const r=await call('post','/data/bookings',student,{user_id:ids[1],property_id:property,move_in_date:'2027-01-10'});
  assert.equal(r.status,201);assert.equal(r.body.booking.status,'pending');
  const id=r.body.booking_id;
  assert.equal((await call('patch','/data/admin/bookings/'+id,admin,{status:'approved'})).status,200);
  const [rooms]=await db.query('SELECT vacant_units FROM properties WHERE id = ?',[property]);assert.equal(rooms[0].vacant_units,0);
  const mine=await call('get','/data/bookings',student);assert.equal(mine.body[0].status,'approved');
  assert.equal((await call('patch','/data/admin/bookings/'+id,admin,{status:'approved'})).status,409);
  assert.equal((await call('patch','/data/admin/bookings/'+id,admin,{status:'cancelled'})).status,200);
  const [restored]=await db.query('SELECT vacant_units FROM properties WHERE id = ?',[property]);assert.equal(restored[0].vacant_units,1);
  console.log('PASS: real MySQL login, admin authorization, listing creation/verification, pending reservation, approval, student status, duplicate protection, cancellation and vacancy restoration.');
 }finally{
  if(ids.length){await db.query('DELETE FROM audit_logs WHERE actor_id = ?',[ids[0]]);await db.query('DELETE FROM bookings WHERE property_id = ?',[property]);await db.query('DELETE FROM properties WHERE id = ?',[property]);await db.query('DELETE FROM users WHERE id IN (?)',[ids]);}
  await db.end();
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
