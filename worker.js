const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

function json(data, status = 200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      "Content-Type":"application/json; charset=utf-8",
      "Cache-Control":"no-store",
      ...corsHeaders
    }
  });
}

function clean(value, max = 200){
  return String(value || "").trim().slice(0,max);
}

export default {
  async fetch(request, env){
    const url = new URL(request.url);

    if (request.method === "OPTIONS"){
      return new Response(null,{status:204,headers:corsHeaders});
    }

    if (url.pathname === "/api/availability" && request.method === "GET"){
      const barber = clean(url.searchParams.get("barber"),100);
      const date = clean(url.searchParams.get("date"),10);

      if (!barber || !/^\d{4}-\d{2}-\d{2}$/.test(date)){
        return json({error:"Invalid barber or date"},400);
      }

      const rows = await env.DB.prepare(
        `SELECT reservation_time AS time
         FROM reservations
         WHERE barber = ?
           AND reservation_date = ?
           AND status = 'confirmed'
         ORDER BY reservation_time`
      ).bind(barber,date).all();

      return json({booked: rows.results.map(row => row.time)});
    }

    if (url.pathname === "/api/reservations" && request.method === "POST"){
      let body;
      try{
        body = await request.json();
      }catch{
        return json({error:"Invalid JSON"},400);
      }

      const reservation = {
        name: clean(body.name,100),
        phone: clean(body.phone,50),
        email: clean(body.email,160),
        service: clean(body.service,100),
        barber: clean(body.barber,100),
        date: clean(body.date,10),
        time: clean(body.time,5),
        message: clean(body.message,1000)
      };

      if (
        !reservation.name ||
        !reservation.phone ||
        !reservation.email ||
        !reservation.service ||
        !reservation.barber ||
        !/^\d{4}-\d{2}-\d{2}$/.test(reservation.date) ||
        !/^\d{2}:\d{2}$/.test(reservation.time)
      ){
        return json({error:"Missing or invalid reservation fields"},400);
      }

      try{
        const result = await env.DB.prepare(
          `INSERT INTO reservations
           (name, phone, email, service, barber, reservation_date, reservation_time, message, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`
        ).bind(
          reservation.name,
          reservation.phone,
          reservation.email,
          reservation.service,
          reservation.barber,
          reservation.date,
          reservation.time,
          reservation.message
        ).run();

        return json({success:true,id:result.meta.last_row_id},201);
      }catch(error){
        const text = String(error?.message || error);

        // The UNIQUE constraint prevents two customers from taking
        // the same barber/date/time slot.
        if (text.includes("UNIQUE") || text.includes("constraint")){
          return json({error:"Slot already booked"},409);
        }

        console.error(error);
        return json({error:"Database error"},500);
      }
    }

    return json({error:"Not found"},404);
  }
};
