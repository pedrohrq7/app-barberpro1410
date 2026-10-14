import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z, ZodError } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.resolve(__dirname, "../data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, "barbearia.sqlite");
export const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
const transaction = (callback, mode = "IMMEDIATE") => {
  db.exec(`BEGIN ${mode}`);
  try { const result = callback(); db.exec("COMMIT"); return result; }
  catch (error) { db.exec("ROLLBACK"); throw error; }
};

const HOURS = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"];
const APP_TIME_ZONE = process.env.APP_TIME_ZONE || "America/Sao_Paulo";
const SERVICES = [
  ["s1", "Combo Corte + Barba", 50, 40], ["s2", "Corte Simples", 25, 20],
  ["s3", "Corte Degradê", 35, 30], ["s4", "Barba", 25, 20],
  ["s5", "Sobrancelha", 10, 15], ["s6", "Barba + Bigode", 30, 25],
];
db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
const migration = db.prepare("INSERT OR IGNORE INTO schema_migrations(version) VALUES (?)");
if (!db.prepare("SELECT 1 FROM schema_migrations WHERE version=1").get()) {
  const migrationSql = fs.readFileSync(path.join(__dirname, "migrations/001_initial.sql"), "utf8");
  transaction(() => { db.exec(migrationSql); migration.run(1); });
}
const seed = () => transaction(() => {
  const insert = db.prepare("INSERT OR IGNORE INTO services(id,name,base_price,duration) VALUES (?,?,?,?)");
  SERVICES.forEach((s) => insert.run(...s));
});
seed();

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedOrigins = (process.env.CORS_ORIGIN || "*").split(",").map((v) => v.trim());
app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)), credentials: false }));
app.use(express.json({ limit: "32kb" }));
app.use((req, res, next) => { res.setHeader("X-Content-Type-Options", "nosniff"); next(); });
const registerLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false, handler: (_req,res) => res.status(429).json({ error: "Muitas tentativas de cadastro. Tente novamente mais tarde.", code: "RATE_LIMITED" }) });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false, handler: (_req,res) => res.status(429).json({ error: "Muitas tentativas de login. Tente novamente mais tarde.", code: "RATE_LIMITED" }) });

class HttpError extends Error { constructor(status, message, code = "REQUEST_ERROR") { super(message); this.status = status; this.code = code; } }
const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const validate = (schema, input) => {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, result.error.issues.map((x) => x.message).join("; "), "VALIDATION_ERROR");
  return result.data;
};
const signToken = (user) => {
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "local-development-secret-change-before-deploy-1234567890");
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres.");
  return jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || "7d", issuer: "barberpro-api", audience: "barberpro-app" });
};
const jwtSecret = () => process.env.JWT_SECRET || "local-development-secret-change-before-deploy-1234567890";
const auth = (req, _res, next) => {
  try {
    const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) throw new HttpError(401, "Autenticação necessária.", "UNAUTHORIZED");
    const claims = jwt.verify(token, jwtSecret(), { issuer: "barberpro-api", audience: "barberpro-app" });
    const user = db.prepare("SELECT id, name, email, role, specialty FROM users WHERE id = ?").get(claims.sub);
    if (!user) throw new HttpError(401, "Sessão inválida.", "UNAUTHORIZED");
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Token inválido ou expirado.", "UNAUTHORIZED"));
  }
};
const role = (...roles) => (req, _res, next) => roles.includes(req.user.role) ? next() : next(new HttpError(403, "Você não tem permissão para esta operação.", "FORBIDDEN"));
const userDto = (row, includeEmail = false) => ({ id: row.id, nome: row.name, ...(includeEmail ? { email: row.email } : {}), tipo: row.role, foto: null, ...(row.role === "barbeiro" ? { especialidade: row.specialty || "Corte & Barba" } : {}) });
const getUser = (id) => db.prepare("SELECT id,name,email,role,specialty FROM users WHERE id=?").get(id);
const serviceDto = (row) => ({ id: row.id, nome: row.name, preco: Number(row.price ?? row.base_price), duracao: row.duration, ativo: row.enabled === undefined ? Boolean(row.active) : Boolean(row.enabled) });
const listServices = (barberId, includeDisabled = false) => {
  const rows = barberId
    ? db.prepare(`SELECT s.id,s.name,s.duration,bs.price,s.active,bs.enabled FROM barber_services bs JOIN services s ON s.id=bs.service_id WHERE bs.barber_id=? AND s.active=1 AND (?=1 OR bs.enabled=1) ORDER BY s.name`).all(barberId, Number(includeDisabled))
    : db.prepare("SELECT id,name,duration,base_price,active FROM services WHERE active=1 ORDER BY id").all();
  return rows.map((row) => ({ ...serviceDto(row), barbeiros: barberId ? [barberId] : db.prepare("SELECT barber_id FROM barber_services WHERE service_id=? AND enabled=1").all(row.id).map((b) => b.barber_id) }));
};
const listBarbers = () => db.prepare("SELECT id,name,email,role,specialty FROM users WHERE role='barbeiro' ORDER BY name").all().map(userDto);
const appointmentDto = (row) => ({
  id: row.id, clienteId: row.client_id, barbeiroId: row.barber_id, servicoId: row.service_id,
  data: row.date, horario: row.time, status: row.status,
  servico: { id: row.service_id, nome: row.service_name, preco: Number(row.price), duracao: row.duration },
  cliente: userDto(getUser(row.client_id)), barbeiro: userDto(getUser(row.barber_id)),
});
const getAppointment = (id) => db.prepare("SELECT * FROM appointments WHERE id=?").get(id);
const listAppointments = (user) => {
  const query = user.role === "barbeiro" ? "SELECT * FROM appointments WHERE barber_id=? ORDER BY date DESC,time DESC" : "SELECT * FROM appointments WHERE client_id=? ORDER BY date DESC,time DESC";
  return db.prepare(query).all(user.id).map(appointmentDto);
};
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD.").refine((v) => { const d = new Date(`${v}T12:00:00Z`); return !Number.isNaN(+d) && d.toISOString().slice(0,10) === v; }, "Data inválida.");
const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|30)$/, "Horário inválido.");
const bookingSchema = z.object({ barbeiroId: z.string().min(1), servicoId: z.string().min(1), data: dateSchema, horario: timeSchema });
const passwordSchema = z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(72).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "A senha não pode ultrapassar 72 bytes.");
const dateMinutes = (date, time) => Date.parse(`${date}T${time}:00Z`);
const startOfDay = (v) => new Date(`${v}T00:00:00Z`);
const localClock = () => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
};
const addDays = (date, days) => { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };

app.get("/health", (_req, res) => res.json({ status: "ok", database: db.prepare("SELECT 1 AS ok").get().ok === 1, timestamp: new Date().toISOString() }));
app.get("/api/services", (req, res) => res.json(listServices(typeof req.query.barberId === "string" ? req.query.barberId : undefined)));
app.get("/api/barbers", (_req, res) => res.json(listBarbers()));
app.post("/api/auth/register", registerLimiter, wrap(async (req, res) => {
  const data = validate(z.object({ nome: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254), senha: passwordSchema, tipo: z.enum(["cliente","barbeiro"]) }), req.body);
  const email = data.email.toLowerCase();
  if (db.prepare("SELECT 1 FROM users WHERE email=? COLLATE NOCASE").get(email)) throw new HttpError(409, "E-mail já cadastrado.", "EMAIL_EXISTS");
  const id = randomUUID();
  const passwordHash = await bcrypt.hash(data.senha, 12);
  const tx = () => transaction(() => {
    db.prepare("INSERT INTO users(id,name,email,password_hash,role,specialty) VALUES(?,?,?,?,?,?)").run(id, data.nome, email, passwordHash, data.tipo, data.tipo === "barbeiro" ? "Corte & Barba" : null);
    if (data.tipo === "barbeiro") {
      const services = db.prepare("SELECT id,base_price FROM services WHERE active=1").all();
      const insertService = db.prepare("INSERT INTO barber_services(barber_id,service_id,price) VALUES(?,?,?)");
      services.forEach((s) => insertService.run(id, s.id, s.base_price));
      const insertSlot = db.prepare("INSERT INTO barber_slots(barber_id,time) VALUES(?,?)");
      HOURS.forEach((h) => insertSlot.run(id, h));
    }
  });
  tx();
  res.status(201).json({ token: signToken(getUser(id)), user: userDto(getUser(id), true) });
}));
app.post("/api/auth/login", loginLimiter, wrap(async (req, res) => {
  const data = validate(z.object({ email: z.string().trim().email(), senha: z.string().min(1).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Senha inválida.") }), req.body);
  const row = db.prepare("SELECT * FROM users WHERE email=? COLLATE NOCASE").get(data.email.toLowerCase());
  if (!row || !(await bcrypt.compare(data.senha, row.password_hash))) throw new HttpError(401, "E-mail ou senha incorretos.", "INVALID_CREDENTIALS");
  res.json({ token: signToken(row), user: userDto(row, true) });
}));
app.get("/api/auth/me", auth, (req, res) => res.json({ user: userDto(req.user, true) }));
app.get("/api/appointments", auth, (req, res) => res.json(listAppointments(req.user)));
app.get("/api/barbers/:id/services", (req, res) => {
  if (!getUser(req.params.id) || getUser(req.params.id).role !== "barbeiro") throw new HttpError(404, "Barbeiro não encontrado.", "NOT_FOUND");
  res.json(listServices(req.params.id));
});
app.get("/api/barbers/:id/availability", (req, res) => {
  const barber = getUser(req.params.id);
  if (!barber || barber.role !== "barbeiro") throw new HttpError(404, "Barbeiro não encontrado.", "NOT_FOUND");
  const q = validate(z.object({ data: dateSchema, servicoId: z.string().min(1) }), req.query);
  const service = db.prepare("SELECT s.duration,bs.enabled FROM barber_services bs JOIN services s ON s.id=bs.service_id WHERE bs.barber_id=? AND bs.service_id=? AND s.active=1").get(barber.id, q.servicoId);
  if (!service || !service.enabled) throw new HttpError(404, "Serviço indisponível para este barbeiro.", "NOT_FOUND");
  const now = localClock();
  if (q.data < now.date) return res.json([]);
  const slots = db.prepare("SELECT time FROM barber_slots WHERE barber_id=? AND enabled=1 ORDER BY time").all(barber.id).map((x) => x.time);
  const existing = db.prepare("SELECT time,duration FROM appointments WHERE barber_id=? AND date=? AND status!='cancelado'").all(barber.id, q.data);
  const starts = slots.filter((time) => {
    const start = dateMinutes(q.data, time), end = start + service.duration * 60000;
    if (q.data === now.date && time <= now.time) return false;
    return !existing.some((a) => start < dateMinutes(q.data,a.time) + a.duration*60000 && end > dateMinutes(q.data,a.time));
  });
  res.json(starts);
});
app.post("/api/appointments", auth, role("cliente"), (req, res) => {
  const input = validate(bookingSchema, req.body);
  const today = localClock();
  if (input.data < today.date || input.data > addDays(today.date, 90)) throw new HttpError(400, "Agendamento deve ser feito para uma data entre hoje e os próximos 90 dias.", "INVALID_DATE");
  const result = transaction(() => {
    const barber = getUser(input.barbeiroId);
    if (!barber || barber.role !== "barbeiro") throw new HttpError(404, "Barbeiro não encontrado.", "NOT_FOUND");
    const service = db.prepare(`SELECT s.id,s.name,s.duration,bs.price FROM barber_services bs JOIN services s ON s.id=bs.service_id WHERE bs.barber_id=? AND bs.service_id=? AND bs.enabled=1 AND s.active=1`).get(barber.id,input.servicoId);
    if (!service) throw new HttpError(400, "Serviço não disponível para este barbeiro.", "SERVICE_UNAVAILABLE");
    if (!db.prepare("SELECT 1 FROM barber_slots WHERE barber_id=? AND time=? AND enabled=1").get(barber.id,input.horario)) throw new HttpError(400,"Horário não oferecido por este barbeiro.","SLOT_UNAVAILABLE");
    const start = dateMinutes(input.data,input.horario), end = start + service.duration*60000;
    if (input.data === today.date && input.horario <= today.time) throw new HttpError(400,"O horário selecionado já passou.","SLOT_PASSED");
    const overlaps = db.prepare("SELECT time,duration FROM appointments WHERE barber_id=? AND date=? AND status!='cancelado'").all(barber.id,input.data).some((a) => start < dateMinutes(input.data,a.time)+a.duration*60000 && end > dateMinutes(input.data,a.time));
    if (overlaps) throw new HttpError(409,"Horário não disponível.","SLOT_TAKEN");
    const id = randomUUID();
    db.prepare("INSERT INTO appointments(id,client_id,barber_id,service_id,service_name,price,duration,date,time) VALUES(?,?,?,?,?,?,?,?,?)").run(id,req.user.id,barber.id,service.id,service.name,service.price,service.duration,input.data,input.horario);
    return appointmentDto(getAppointment(id));
  });
  res.status(201).json(result);
});
app.patch("/api/appointments/:id/cancel", auth, (req, res) => {
  const row = getAppointment(req.params.id);
  if (!row) throw new HttpError(404,"Agendamento não encontrado.","NOT_FOUND");
  if (req.user.role === "cliente" && row.client_id !== req.user.id) throw new HttpError(403,"Você não pode alterar este agendamento.","FORBIDDEN");
  if (req.user.role === "barbeiro" && row.barber_id !== req.user.id) throw new HttpError(403,"Você não pode alterar este agendamento.","FORBIDDEN");
  if (row.status !== "pendente") throw new HttpError(409,"Somente agendamentos pendentes podem ser cancelados.","INVALID_STATUS");
  db.prepare("UPDATE appointments SET status='cancelado',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(row.id);
  res.json(appointmentDto(getAppointment(row.id)));
});
app.patch("/api/appointments/:id/complete", auth, role("barbeiro"), (req, res) => {
  const row = getAppointment(req.params.id);
  if (!row) throw new HttpError(404,"Agendamento não encontrado.","NOT_FOUND");
  if (row.barber_id !== req.user.id) throw new HttpError(403,"Você não pode concluir este agendamento.","FORBIDDEN");
  if (row.status !== "pendente") throw new HttpError(409,"Somente agendamentos pendentes podem ser concluídos.","INVALID_STATUS");
  db.prepare("UPDATE appointments SET status='concluido',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(row.id);
  res.json(appointmentDto(getAppointment(row.id)));
});
app.get("/api/barber/services", auth, role("barbeiro"), (req,res) => res.json(listServices(req.user.id, true)));
app.patch("/api/barber/services/:id", auth, role("barbeiro"), (req,res) => {
  const input = validate(z.object({ ativo: z.boolean().optional(), preco: z.number().positive().max(100000).optional() }).refine((v) => v.ativo !== undefined || v.preco !== undefined,"Informe preço e/ou status."),req.body);
  const current = db.prepare("SELECT * FROM barber_services WHERE barber_id=? AND service_id=?").get(req.user.id,req.params.id);
  if (!current) throw new HttpError(404,"Serviço não encontrado para este barbeiro.","NOT_FOUND");
  db.prepare("UPDATE barber_services SET enabled=?,price=? WHERE barber_id=? AND service_id=?").run(input.ativo === undefined ? current.enabled : Number(input.ativo),input.preco === undefined ? current.price : input.preco,req.user.id,req.params.id);
  res.json(listServices(req.user.id, true).find((s) => s.id === req.params.id) || { id:req.params.id,ativo:input.ativo ?? false,preco:input.preco ?? current.price });
});
app.get("/api/barber/schedule", auth, role("barbeiro"), (req,res) => res.json(db.prepare("SELECT time,enabled FROM barber_slots WHERE barber_id=? ORDER BY time").all(req.user.id).map((r) => ({ horario:r.time, ativo:Boolean(r.enabled) }))));
app.put("/api/barber/schedule", auth, role("barbeiro"), (req,res) => {
  const input = validate(z.object({ horarios: z.array(timeSchema).max(HOURS.length) }),req.body);
  if (new Set(input.horarios).size !== input.horarios.length || input.horarios.some((t) => !HOURS.includes(t))) throw new HttpError(400,"A lista contém horários inválidos ou duplicados.","VALIDATION_ERROR");
  const save = () => transaction(() => {
    const update = db.prepare("INSERT INTO barber_slots(barber_id,time,enabled) VALUES(?,?,?) ON CONFLICT(barber_id,time) DO UPDATE SET enabled=excluded.enabled");
    HOURS.forEach((time) => update.run(req.user.id,time,Number(input.horarios.includes(time))));
  });
  save();
  res.json(HOURS.map((horario) => ({ horario, ativo:input.horarios.includes(horario) })));
});
app.get("/api/barber/dashboard", auth, role("barbeiro"), (req,res) => {
  const rows = db.prepare("SELECT * FROM appointments WHERE barber_id=? AND status!='cancelado'").all(req.user.id);
  const today = localClock().date;
  const now = startOfDay(today);
  const weekStart = startOfDay(addDays(today,-6));
  const todayDate = startOfDay(today);
  const monthStart = new Date(Date.UTC(todayDate.getUTCFullYear(),todayDate.getUTCMonth(),1));
  const completed = rows.filter((r) => r.status === "concluido");
  const inRange = (r, start) => startOfDay(r.date) >= start && startOfDay(r.date) <= now;
  const weekRows = rows.filter((r) => inRange(r,weekStart));
  const monthRows = rows.filter((r) => inRange(r,monthStart));
  const profit = (list) => completed.filter((r) => inRange(r,list)).reduce((sum,r) => sum + r.price,0);
  const counts = new Map(); rows.forEach((r) => counts.set(r.date,(counts.get(r.date)||0)+1));
  const busiest = [...counts.entries()].sort((a,b) => b[1]-a[1])[0]?.[0] || "—";
  const graph = Array.from({length:4},(_,i) => {
    const end = startOfDay(addDays(today,1-i*7));
    const start = startOfDay(addDays(today,-6-i*7));
    return { semana:`S${4-i}`,atendimentos:rows.filter((r) => startOfDay(r.date)>=start && startOfDay(r.date)<end).length };
  }).reverse();
  res.json({ totalMes:monthRows.length,totalSemana:weekRows.length,lucroSemana:profit(weekStart),lucroMes:profit(monthStart),clientesUnicos:new Set(rows.map((r)=>r.client_id)).size,diaMaisMovimentado:busiest,grafico:graph });
});
app.get("/api/profile", auth, (req,res) => res.json({ user:userDto(req.user, true) }));
app.use((_req,_res,next) => next(new HttpError(404,"Rota não encontrada.","NOT_FOUND")));
app.use((err,_req,res,_next) => {
  const status = err instanceof ZodError ? 400 : err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status === 500 ? "Erro interno do servidor." : err.message, code:err.code || (status === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR") });
});

export default app;
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) throw new Error("Defina JWT_SECRET com pelo menos 32 caracteres em produção.");
  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port,"0.0.0.0",() => console.log(`BarberPro API listening on 0.0.0.0:${port} (${dbPath})`));
  const shutdown = () => server.close(() => { db.close(); process.exit(0); });
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
