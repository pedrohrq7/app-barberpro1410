import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
process.env.DATABASE_PATH = ":memory:";
process.env.JWT_SECRET = "test-secret-0123456789-0123456789-012345";
const { default: app, db } = await import("../server.js");

let barberToken, clientToken, otherClientToken, barberId, clientId, appointmentId;
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate()+1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const register = (nome,email,tipo="cliente") => request(app).post("/api/auth/register").send({nome,email,senha:"SenhaForte123",tipo});

before(async () => {
  const barber = await register("Barbeiro de Teste","barbeiro@test.local","barbeiro");
  assert.equal(barber.status,201);
  barberToken = barber.body.token; barberId = barber.body.user.id;
  const client = await register("Cliente de Teste","cliente@test.local");
  assert.equal(client.status,201);
  clientToken = client.body.token; clientId = client.body.user.id;
  const other = await register("Outro Cliente","outro@test.local");
  assert.equal(other.status,201); otherClientToken = other.body.token;
});
after(() => db.close());

test("health check e catálogo usam o banco SQLite", async () => {
  const health = await request(app).get("/health");
  assert.equal(health.status,200); assert.equal(health.body.database,true);
  const services = await request(app).get("/api/services");
  assert.equal(services.status,200); assert.equal(services.body.length,6);
  const barbers = await request(app).get("/api/barbers");
  assert.equal(barbers.body[0].id,barberId);
  assert.equal("email" in barbers.body[0],false);
});

test("senha é armazenada com hash e sessão permite recuperar identidade", async () => {
  const row = db.prepare("SELECT password_hash FROM users WHERE id=?").get(clientId);
  assert.notEqual(row.password_hash,"SenhaForte123");
  assert.match(row.password_hash,/^\$2[aby]\$/);
  const me = await request(app).get("/api/auth/me").set("Authorization",`Bearer ${clientToken}`);
  assert.equal(me.status,200); assert.equal(me.body.user.email,"cliente@test.local");
  const denied = await request(app).get("/api/auth/me"); assert.equal(denied.status,401);
});

test("login, email duplicado e payloads inválidos são tratados corretamente", async () => {
  const login = await request(app).post("/api/auth/login").send({email:"CLIENTE@test.local",senha:"SenhaForte123"});
  assert.equal(login.status,200); assert.ok(login.body.token);
  const badLogin = await request(app).post("/api/auth/login").send({email:"cliente@test.local",senha:"errada"}); assert.equal(badLogin.status,401);
  const duplicate = await register("Duplicado","cliente@test.local"); assert.equal(duplicate.status,409);
  const invalid = await request(app).post("/api/auth/register").send({nome:"A",email:"invalido",senha:"123",tipo:"admin"}); assert.equal(invalid.status,400);
});

test("cliente consulta slots, cria agendamento persistido e conflito é rejeitado", async () => {
  const date=tomorrow();
  const availability=await request(app).get(`/api/barbers/${barberId}/availability?data=${date}&servicoId=s2`);
  assert.equal(availability.status,200); assert.ok(availability.body.includes("08:00"));
  const payload={barbeiroId:barberId,servicoId:"s1",data:date,horario:"08:00"};
  const created=await request(app).post("/api/appointments").set("Authorization",`Bearer ${clientToken}`).send(payload);
  assert.equal(created.status,201); appointmentId=created.body.id; assert.equal(created.body.servico.preco,50);
  assert.equal(db.prepare("SELECT count(*) n FROM appointments WHERE id=?").get(appointmentId).n,1);
  const overlap=await request(app).get(`/api/barbers/${barberId}/availability?data=${date}&servicoId=s2`);
  assert.equal(overlap.body.includes("08:30"),false);
  const conflict=await request(app).post("/api/appointments").set("Authorization",`Bearer ${otherClientToken}`).send(payload);
  assert.equal(conflict.status,409);
  const forbidden=await request(app).post("/api/appointments").set("Authorization",`Bearer ${barberToken}`).send(payload);
  assert.equal(forbidden.status,403);
  const second=await request(app).post("/api/appointments").set("Authorization",`Bearer ${clientToken}`).send({...payload,servicoId:"s2",horario:"09:00"});
  assert.equal(second.status,201);
  const cancelled=await request(app).patch(`/api/appointments/${second.body.id}/cancel`).set("Authorization",`Bearer ${clientToken}`);
  assert.equal(cancelled.body.status,"cancelado");
  const released=await request(app).get(`/api/barbers/${barberId}/availability?data=${date}&servicoId=s2`);
  assert.equal(released.body.includes("09:00"),true);
});

test("listagem é isolada por usuário e mutações exigem perfil/dono corretos", async () => {
  const own=await request(app).get("/api/appointments").set("Authorization",`Bearer ${clientToken}`);
  const other=await request(app).get("/api/appointments").set("Authorization",`Bearer ${otherClientToken}`);
  assert.equal(own.body.length,2); assert.equal(other.body.length,0);
  const denied=await request(app).patch(`/api/appointments/${appointmentId}/complete`).set("Authorization",`Bearer ${clientToken}`);
  assert.equal(denied.status,403);
  const notOwner=await request(app).patch(`/api/appointments/${appointmentId}/cancel`).set("Authorization",`Bearer ${otherClientToken}`);
  assert.equal(notOwner.status,403);
  const completed=await request(app).patch(`/api/appointments/${appointmentId}/complete`).set("Authorization",`Bearer ${barberToken}`);
  assert.equal(completed.status,200); assert.equal(completed.body.status,"concluido");
  const duplicateTransition=await request(app).patch(`/api/appointments/${appointmentId}/cancel`).set("Authorization",`Bearer ${clientToken}`);
  assert.equal(duplicateTransition.status,409);
});

test("barbeiro pode editar serviço e agenda, cliente não", async () => {
  const forbidden=await request(app).get("/api/barber/services").set("Authorization",`Bearer ${clientToken}`); assert.equal(forbidden.status,403);
  const changed=await request(app).patch("/api/barber/services/s2").set("Authorization",`Bearer ${barberToken}`).send({preco:29});
  assert.equal(changed.status,200); assert.equal(changed.body.preco,29);
  const disabled=await request(app).patch("/api/barber/services/s2").set("Authorization",`Bearer ${barberToken}`).send({ativo:false});
  assert.equal(disabled.body.ativo,false);
  const management=await request(app).get("/api/barber/services").set("Authorization",`Bearer ${barberToken}`);
  assert.equal(management.body.find((s)=>s.id==="s2").ativo,false);
  const publicCatalog=await request(app).get(`/api/barbers/${barberId}/services`);
  assert.equal(publicCatalog.body.some((s)=>s.id==="s2"),false);
  const enabled=await request(app).patch("/api/barber/services/s2").set("Authorization",`Bearer ${barberToken}`).send({ativo:true});
  assert.equal(enabled.body.ativo,true);
  const saved=await request(app).put("/api/barber/schedule").set("Authorization",`Bearer ${barberToken}`).send({horarios:["09:00","09:30"]});
  assert.equal(saved.status,200); assert.equal(saved.body.filter((x)=>x.ativo).length,2);
  const invalid=await request(app).put("/api/barber/schedule").set("Authorization",`Bearer ${barberToken}`).send({horarios:["23:59"]}); assert.equal(invalid.status,400);
  const stats=await request(app).get("/api/barber/dashboard").set("Authorization",`Bearer ${barberToken}`); assert.equal(stats.status,200); assert.ok(Array.isArray(stats.body.grafico));
});
