export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
    };
    if (request.method === "OPTIONS") return new Response("", {headers:cors});
    const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"Content-Type":"application/json",...cors}});

    if(url.pathname==="/api/submit" && request.method==="POST"){
      const b=await request.json();
      if(!b.name||!b.email||!b.internship||!b.photo) return json({error:"missing"},400);
      const ip=request.headers.get("CF-Connecting-IP")||"Unavailable";
      const id=crypto.randomUUID();
      const record={id,createdAt:new Date().toISOString(),name:b.name,email:b.email,internship:b.internship,ip,
        location:b.location||null,photo:b.photo};
      // 30-minute automatic expiry.
      await env.TEMP.put(id,JSON.stringify(record),{expirationTtl:1800});
      return json({ok:true});
    }

    if(url.pathname==="/api/admin" && request.method==="GET"){
      if(request.headers.get("X-Admin-Password")!==env.ADMIN_PASSWORD)return json({error:"unauthorized"},401);
      const list=await env.TEMP.list();
      const out=[];
      for(const k of list.keys){const v=await env.TEMP.get(k.name,"json");if(v)out.push(v)}
      return json(out);
    }

    if(url.pathname.startsWith("/api/admin/") && request.method==="DELETE"){
      if(request.headers.get("X-Admin-Password")!==env.ADMIN_PASSWORD)return json({error:"unauthorized"},401);
      const id=url.pathname.split("/").pop();
      await env.TEMP.delete(id); return json({ok:true});
    }
    return env.ASSETS.fetch(request);
  }
};