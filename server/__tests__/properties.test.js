const request=require('supertest');
jest.mock('../db',()=>({query:jest.fn(),getConnection:jest.fn()}));
const {setupDatabaseApp}=require('../test-support/databaseHarness');
let app,access,db;
beforeEach(()=>{({app,access}=setupDatabaseApp());db=require('../db');});

test('listing creation stores amenities in a relationship table atomically',async()=>{
 const connection={
  beginTransaction:jest.fn(),
  commit:jest.fn(),
  rollback:jest.fn(),
  release:jest.fn(),
  query:jest.fn().mockResolvedValue([{affectedRows:1}]),
 };
 db.getConnection.mockResolvedValue(connection);

 const response=await request(app).post('/data/properties')
  .auth(access.issueSession(13),{type:'bearer'})
  .send({title:'Student room',type:'Bedsitter',price:12000,location:'Madaraka',campus:'strathmore',amenities:['Wi-Fi','Laundry','Wi-Fi']});

 expect(response.status).toBe(201);
 expect(connection.beginTransaction).toHaveBeenCalled();
 expect(connection.commit).toHaveBeenCalled();
 expect(connection.query).toHaveBeenCalledTimes(2);
 expect(connection.query.mock.calls[1][0]).toContain('property_amenities');
 expect(connection.query.mock.calls[1][1][0].map(([,amenity])=>amenity)).toEqual(['Wi-Fi','Laundry']);
});

test('listing search joins normalized amenities and keeps filters parameterized',async()=>{
 db.query.mockResolvedValue([[{id:'p1',price:12000,verified:1,vacant_units:1,amenities:'Wi-Fi'}]]);

 const response=await request(app).get('/data/properties').query({search:'room',campus:'strathmore'});

 expect(response.status).toBe(200);
 expect(db.query.mock.calls[0][0]).toContain('property_amenities');
 expect(db.query.mock.calls[0][0]).not.toContain('room');
 expect(db.query.mock.calls[0][1]).toEqual(['strathmore','%room%','%room%','%room%']);
 expect(response.body[0].amenities).toEqual(['Wi-Fi']);
});
