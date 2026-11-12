const router=require('express').Router();
const crypto=require('crypto');
const db=require('../db');
const {requireUser,requireAdmin}=require('../middleware/session');
function format(row){
 let amenities=[];
 try{amenities=JSON.parse(row.amenities||'[]');}catch{amenities=String(row.amenities||'').split(',').map(s=>s.trim()).filter(Boolean);}
 const fields=['id','title','type','price','location','campus','distance','verified','image','description','landlord','phone','whatsapp','vacant_units','latitude','longitude','security_deposit','booking_fee','water_included','wifi_included','garbage_included','gender_policy','furnishing_status','created_at'];
 return {...Object.fromEntries(fields.map(key=>[key,row[key]])),price:Number(row.price),verified:Boolean(row.verified),vacant_units:Number(row.vacant_units),amenities:Array.isArray(amenities)?amenities:[],images:row.image?[row.image]:[]};
}
router.get('/',async(req,res,next)=>{
 try{
  let sql='SELECT p.*, GROUP_CONCAT(pa.amenity ORDER BY pa.amenity SEPARATOR \',\') AS amenities FROM properties p LEFT JOIN property_amenities pa ON pa.property_id = p.id WHERE p.verified = 1';const params=[];
  for(const key of ['campus','type'])if(req.query[key]&&req.query[key]!=='all'){sql+=` AND p.${key} = ?`;params.push(req.query[key]);}
  for(const [key,operator] of [['minPrice','>='],['maxPrice','<=']])if(req.query[key]!==undefined){const price=Number(req.query[key]);if(!Number.isFinite(price)||price<0)return res.status(400).json({error:'Invalid price filter.'});sql+=` AND p.price ${operator} ?`;params.push(price);}
  if(req.query.search){sql+=' AND (p.title LIKE ? OR p.location LIKE ? OR p.type LIKE ?)';const search='%'+req.query.search+'%';params.push(search,search,search);}
  const [rows]=await db.query(sql+' GROUP BY p.id ORDER BY p.created_at DESC',params);res.json(rows.map(format));
 }catch(error){next(error);}
});
router.get('/:id',async(req,res,next)=>{
 try{const [rows]=await db.query('SELECT p.*, GROUP_CONCAT(pa.amenity ORDER BY pa.amenity SEPARATOR \',\') AS amenities FROM properties p LEFT JOIN property_amenities pa ON pa.property_id = p.id WHERE p.id = ? AND p.verified = 1 GROUP BY p.id',[req.params.id]);if(!rows[0])return res.status(404).json({error:'Listing not found.'});res.json(format(rows[0]));}catch(error){next(error);}
});
router.post('/',requireUser,async(req,res,next)=>{
 const required=['title','type','location','campus'];
 if(required.some(key=>typeof req.body[key]!=='string'||!req.body[key].trim()||req.body[key].length>255)||!Number.isInteger(req.body.price)||req.body.price<0||req.body.verified!==undefined)return res.status(400).json({error:'Enter a title, room type, location, campus and valid rent.'});
 const {title,type,price,location,campus,description='',phone='',amenities='',image='',vacant_units=1}=req.body;
 if(!Number.isInteger(vacant_units)||vacant_units<0||[description,phone,image].some(value=>typeof value!=='string')||!(typeof amenities==='string'||Array.isArray(amenities)&&amenities.every(value=>typeof value==='string')))return res.status(400).json({error:'Invalid listing details.'});
 const amenityList=[...new Set((Array.isArray(amenities)?amenities:amenities.split(',')).map(value=>value.trim()).filter(Boolean))];
 if(amenityList.some(value=>value.length>100))return res.status(400).json({error:'Each amenity must be 100 characters or fewer.'});
 const id='prop-'+crypto.randomUUID();
 let connection;
 try{
  connection=await db.getConnection();await connection.beginTransaction();
  await connection.query('INSERT INTO properties (id,title,type,price,location,campus,description,phone,image,vacant_units,verified) VALUES (?,?,?,?,?,?,?,?,?,?,0)',[id,title,type,price,location,campus,description,phone,image,vacant_units]);
  if(amenityList.length)await connection.query('INSERT INTO property_amenities (property_id,amenity) VALUES ?',[[...amenityList.map(amenity=>[id,amenity])]]);
  await connection.commit();
  res.status(201).json({property:{id,title,verified:false},message:'Listing submitted for verification.'});
 }catch(error){if(connection)await connection.rollback();next(error);}finally{if(connection)connection.release();}
});
router.delete('/:id',requireAdmin,async(req,res,next)=>{
 try{
  const [bookings]=await db.query('SELECT id FROM bookings WHERE property_id = ? LIMIT 1',[req.params.id]);
  if(bookings.length)return res.status(409).json({error:'This listing has reservation history. Unpublish it instead.'});
  const [result]=await db.query('DELETE FROM properties WHERE id = ?',[req.params.id]);
  if(!result.affectedRows)return res.status(404).json({error:'Listing not found.'});
  await db.query('INSERT INTO audit_logs (actor_id,action,target_id) VALUES (?,?,?)',[req.userId,'listing.deleted',req.params.id]);
  res.json({message:'Listing deleted.'});
 }catch(error){next(error);}
});
module.exports=router;
