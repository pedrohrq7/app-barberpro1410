import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { request, setAuthToken } from "../services/api";

const AppContext = createContext(null);
const TOKEN_KEY = "barberpro.session.token";
const readToken = () => Platform.OS === "web" ? AsyncStorage.getItem(TOKEN_KEY) : SecureStore.getItemAsync(TOKEN_KEY);
const writeToken = (token) => Platform.OS === "web" ? AsyncStorage.setItem(TOKEN_KEY, token) : SecureStore.setItemAsync(TOKEN_KEY, token);
const removeToken = () => Platform.OS === "web" ? AsyncStorage.removeItem(TOKEN_KEY) : SecureStore.deleteItemAsync(TOKEN_KEY);

export function AppProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [agendamentos, setAgendamentos] = useState([]);
    const [barbeiros, setBarbeiros] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [servicosBarbeiro, setServicosBarbeiro] = useState([]);
    const [horariosBarbeiro, setHorariosBarbeiro] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadCatalog = useCallback(async () => {
        const [catalog, professionals] = await Promise.all([request("/services"), request("/barbers")]);
        setServicos(catalog);
        setBarbeiros(professionals);
    }, []);

    const loadPrivate = useCallback(async (user) => {
        const bookings = await request("/appointments");
        setAgendamentos(bookings);
        if (user.tipo === "barbeiro") {
            const [services, schedule, stats] = await Promise.all([
                request("/barber/services"), request("/barber/schedule"), request("/barber/dashboard"),
            ]);
            setServicosBarbeiro(services);
            setHorariosBarbeiro(schedule.filter((item) => item.ativo).map((item) => item.horario));
            setDashboard(stats);
        } else {
            setServicosBarbeiro([]);
            setHorariosBarbeiro([]);
            setDashboard(null);
        }
        await loadCatalog();
    }, [loadCatalog]);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                try { await loadCatalog(); } catch (_error) { /* a API indisponível não encerra a tela de login */ }
                const token = await readToken();
                if (!token) return;
                setAuthToken(token);
                try {
                    const { user } = await request("/auth/me");
                    if (!active) return;
                    setUsuario(user);
                    try { await loadPrivate(user); } catch (_error) { /* falha secundária não invalida o token */ }
                } catch (error) {
                    if (error.status === 401) {
                        setAuthToken(null);
                        await removeToken();
                    }
                }
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [loadCatalog, loadPrivate]);

    const login = async (email, senha) => {
        try {
            const result = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, senha }) });
            setAuthToken(result.token);
            await writeToken(result.token);
            setUsuario(result.user);
            try { await loadPrivate(result.user); } catch (_error) { /* credenciais válidas; os dados podem ser recarregados */ }
            return { ok: true, tipo: result.user.tipo };
        } catch (error) { return { ok: false, erro: error.message }; }
    };

    const cadastrar = async (nome, email, senha, tipo) => {
        try {
            const result = await request("/auth/register", { method: "POST", body: JSON.stringify({ nome, email, senha, tipo }) });
            setAuthToken(result.token);
            await writeToken(result.token);
            setUsuario(result.user);
            try { await loadPrivate(result.user); } catch (_error) { /* cadastro concluído; os dados podem ser recarregados */ }
            return { ok: true, tipo: result.user.tipo };
        } catch (error) { return { ok: false, erro: error.message }; }
    };

    const logout = async () => {
        setAuthToken(null);
        setUsuario(null);
        setAgendamentos([]);
        setDashboard(null);
        setServicosBarbeiro([]);
        try { await removeToken(); } catch (_error) { /* sessão local já foi removida em memória */ }
    };

    const refreshAppointments = async () => {
        const bookings = await request("/appointments");
        setAgendamentos(bookings);
        return bookings;
    };
    const mergeAppointment = (updated) => {
        setAgendamentos((old) => [updated, ...old.filter((item) => item.id !== updated.id)]);
        if (usuario?.tipo === "barbeiro") request("/barber/dashboard").then(setDashboard).catch(() => {});
    };
    const horariosOcupados = (barberId, date) => agendamentos.filter((a) => a.barbeiroId === barberId && a.data === date && a.status !== "cancelado").map((a) => a.horario);
    const horariosDisponiveis = useCallback(async (barberId, date, serviceId) => {
        if (!date || !serviceId) return [];
        try { return await request(`/barbers/${encodeURIComponent(barberId)}/availability?data=${encodeURIComponent(date)}&servicoId=${encodeURIComponent(serviceId)}`); }
        catch (_error) { return []; }
    }, []);
    const servicosDoBarbeiro = useCallback(async (barberId) => {
        try { return await request(`/barbers/${encodeURIComponent(barberId)}/services`); }
        catch (_error) { return []; }
    }, []);
    const criarAgendamento = async (booking) => {
        try { const created = await request("/appointments", { method: "POST", body: JSON.stringify(booking) }); mergeAppointment(created); return { ok: true, agendamento: created }; }
        catch (error) { return { ok: false, erro: error.message }; }
    };
    const updateAppointment = async (id, action) => {
        try { const result = await request(`/appointments/${encodeURIComponent(id)}/${action}`, { method: "PATCH" }); mergeAppointment(result); return { ok: true }; }
        catch (error) { return { ok: false, erro: error.message }; }
    };
    const cancelarAgendamento = (id) => updateAppointment(id, "cancel");
    const concluirAgendamento = (id) => updateAppointment(id, "complete");
    const agendamentosCliente = (clientId) => agendamentos.filter((a) => a.clienteId === clientId);
    const agendamentosBarbeiro = (barberId) => agendamentos.filter((a) => a.barbeiroId === barberId);
    const getBarbeiro = (id) => barbeiros.find((barber) => barber.id === id) || agendamentos.find((a) => a.barbeiroId === id)?.barbeiro;
    const getCliente = (id) => (usuario?.id === id ? usuario : agendamentos.find((a) => a.clienteId === id)?.cliente);
    const getServico = (id) => servicos.find((service) => service.id === id) || agendamentos.find((a) => a.servicoId === id)?.servico;
    const dashboardBarbeiro = () => dashboard || { totalMes: 0, totalSemana: 0, lucroSemana: 0, lucroMes: 0, clientesUnicos: 0, diaMaisMovimentado: "—", grafico: [1,2,3,4].map((i) => ({ semana: `S${i}`, atendimentos: 0 })) };

    const atualizarServicoBarbeiro = async (id, patch) => {
        try {
            const updated = await request(`/barber/services/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) });
            setServicosBarbeiro((old) => old.map((service) => service.id === id ? { ...service, ...updated } : service));
            await loadCatalog();
            return { ok: true };
        } catch (error) { return { ok: false, erro: error.message }; }
    };
    const atualizarHorariosBarbeiro = async (times) => {
        try {
            const updated = await request("/barber/schedule", { method: "PUT", body: JSON.stringify({ horarios: times }) });
            setHorariosBarbeiro(updated.filter((item) => item.ativo).map((item) => item.horario));
            return { ok: true };
        } catch (error) { return { ok: false, erro: error.message }; }
    };
    const atualizarDashboard = async () => {
        try { const stats = await request("/barber/dashboard"); setDashboard(stats); return stats; }
        catch (_error) { return dashboardBarbeiro(); }
    };

    const value = {
        usuario, loading, agendamentos, barbeiros, servicos, servicosBarbeiro, horariosBarbeiro,
        login, cadastrar, logout, refreshAppointments, horariosOcupados, horariosDisponiveis,
        servicosDoBarbeiro,
        criarAgendamento, cancelarAgendamento, concluirAgendamento,
        agendamentosCliente, agendamentosBarbeiro, dashboardBarbeiro, atualizarDashboard,
        atualizarServicoBarbeiro, atualizarHorariosBarbeiro, getBarbeiro, getCliente, getServico,
    };
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() { return useContext(AppContext); }
