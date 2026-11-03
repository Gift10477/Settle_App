import { useCallback,useEffect,useState } from 'react';
import { managementRequest } from '../../services/database';
import './Management.css';
export default function ReservationsView(){
 const [rows,setRows]=useState([]),[error,setError]=useState('');
 const load=useCallback(()=>managementRequest('/bookings').then(d=>{setRows(d);setError('');}).catch(e=>setError(e.message)),[]);
 useEffect(()=>{load();const id=setInterval(load,15000);return()=>clearInterval(id);},[load]);
 return <section className="management"><h1>My reservations</h1><p>Track your room requests. Status refreshes every 15 seconds.</p><button onClick={load}>Refresh</button>{error&&<p role="alert">{error}</p>}<div className="management-list">{rows.map(b=><article key={b.id}><h2>{b.property_title}</h2><p>Reservation #{b.id} · <strong>{b.status}</strong></p><p>Move in: {b.move_in_date?.slice(0,10)}</p>{b.status==='pending'&&<p>Awaiting administrator approval.</p>}</article>)}</div>{!rows.length&&!error&&<p>No reservations yet.</p>}</section>;
}
