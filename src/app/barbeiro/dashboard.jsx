// src/app/barbeiro/dashboard.jsx  —  Dashboard do Barbeiro
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";

const { width } = Dimensions.get("window");

function MiniGrafico({ dados }) {
    const max = Math.max(...dados.map(d => d.atendimentos), 1);
    return (
        <View style={graficoStyles.container}>
            <Text style={graficoStyles.titulo}>Atendimentos — últimas 4 semanas</Text>
            <View style={graficoStyles.barras}>
                {dados.map((d, i) => (
                    <View key={i} style={graficoStyles.coluna}>
                        <Text style={graficoStyles.valor}>{d.atendimentos}</Text>
                        <View style={graficoStyles.barraWrapper}>
                            <View
                                style={[
                                    graficoStyles.barra,
                                    { height: max > 0 ? (d.atendimentos / max) * 80 : 4 }
                                ]}
                            />
                        </View>
                        <Text style={graficoStyles.semana}>{d.semana}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const graficoStyles = StyleSheet.create({
    container: {
        backgroundColor: "#1F2937", borderRadius: 16, padding: 16, marginTop: 4,
    },
    titulo: { color: "#6B7280", fontSize: 12, marginBottom: 12 },
    barras: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", height: 120 },
    coluna: { alignItems: "center", flex: 1, gap: 4 },
    valor:  { color: "#F5C518", fontSize: 12, fontWeight: "bold" },
    barraWrapper: { justifyContent: "flex-end", height: 80 },
    barra: { width: 28, backgroundColor: "#F5C518", borderRadius: 6, minHeight: 4 },
    semana: { color: "#6B7280", fontSize: 11 },
});

export default function Dashboard() {
    const router = useRouter();
    const { usuario, dashboardBarbeiro, agendamentosBarbeiro, logout } = useApp();

    if (!usuario) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#fff' }}>Carregando perfil...</Text>
            </View>
        );
    }

    const stats = dashboardBarbeiro(usuario.id);

    // Próximos agendamentos pendentes
    const proximos = agendamentosBarbeiro(usuario.id)
        .filter(a => a.status === "pendente")
        .sort((a, b) => new Date(`${a.data}T${a.horario}`) - new Date(`${b.data}T${b.horario}`))
        .slice(0, 3);

    const handleLogout = () => { logout(); router.replace("/login"); };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.titulo}>Dashboard</Text>
                    <Text style={styles.subtitulo}>Olá, {usuario.nome.split(" ")[0]} ✂️</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                </TouchableOpacity>
            </View>

            {/* Estatísticas */}
            <View style={styles.statsGrid}>
                <StatCard icon="calendar"    label="Atendimentos\no mês"    value={stats.totalMes}    cor="#3B82F6" />
                <StatCard icon="today"       label="Atendimentos\na semana" value={stats.totalSemana} cor="#8B5CF6" />
                <StatCard icon="people"      label="Clientes\atendidos"     value={stats.clientesUnicos} cor="#10B981" />
                <StatCard icon="cash"        label="Lucro\semanal"          value={`R$ ${stats.lucroSemana}`}  cor="#F5C518" />
                <StatCard icon="wallet"      label="Lucro\mensal"           value={`R$ ${stats.lucroMes}`}    cor="#F5C518" wide />
            </View>

            {/* Dia mais movimentado */}
            <View style={styles.diaCard}>
                <Ionicons name="flame" size={20} color="#F97316" />
                <View style={{ flex: 1 }}>
                    <Text style={styles.diaLabel}>Dia mais movimentado</Text>
                    <Text style={styles.diaValue}>
                        {stats.diaMaisMovimentado !== "—"
                            ? new Date(stats.diaMaisMovimentado + "T12:00:00")
                                .toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
                            : "—"}
                    </Text>
                </View>
            </View>

            {/* Gráfico */}
            <MiniGrafico dados={stats.grafico} />

            {/* Próximos atendimentos */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Próximos atendimentos</Text>
                <TouchableOpacity onPress={() => router.push("/barbeiro/agenda")}>
                    <Text style={styles.verTodos}>Ver todos</Text>
                </TouchableOpacity>
            </View>

            {proximos.length === 0 && (
                <Text style={styles.vazio}>Nenhum agendamento pendente.</Text>
            )}
            {proximos.map(ag => {
                const cliente = ag.cliente;
                const servico = ag.servico;
                const dataFmt = new Date(ag.data + "T12:00:00").toLocaleDateString("pt-BR", {
                    weekday: "short", day: "2-digit", month: "short",
                });
                return (
                    <View key={ag.id} style={styles.proximoCard}>
                        <View style={styles.proximoHora}>
                            <Text style={styles.proximoHoraText}>{ag.horario}</Text>
                            <Text style={styles.proximoDataText}>{dataFmt}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.proximoCliente}>{cliente?.nome}</Text>
                            <Text style={styles.proximoServico}>{servico?.nome}</Text>
                        </View>
                        <Text style={styles.proximoPreco}>R$ {servico?.preco}</Text>
                    </View>
                );
            })}

            {/* Botões de acesso rápido */}
            <View style={styles.acaoRow}>
                <TouchableOpacity style={styles.acaoBtn} onPress={() => router.push("/barbeiro/agenda")}>
                    <Ionicons name="calendar" size={22} color="#F5C518" />
                    <Text style={styles.acaoBtnText}>Agenda</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acaoBtn} onPress={() => router.push("/barbeiro/gerenciar")}>
                    <Ionicons name="settings" size={22} color="#F5C518" />
                    <Text style={styles.acaoBtnText}>Gerenciar</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
    );
}

function StatCard({ icon, label, value, cor, wide }) {
    return (
        <View style={[styles.statCard, wide && styles.statCardWide]}>
            <View style={[styles.statIcone, { backgroundColor: cor + "20" }]}>
                <Ionicons name={icon} size={20} color={cor} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#111827" },
    scroll: { padding: 16, paddingBottom: 100 },

    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    titulo: { fontSize: 26, fontWeight: "bold", color: "#fff" },
    subtitulo: { color: "#6B7280", fontSize: 14, marginTop: 2 },
    logoutBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: "#EF444415", justifyContent: "center", alignItems: "center",
    },

    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
    statCard: {
        width: (width - 42) / 2, backgroundColor: "#1F2937",
        borderRadius: 14, padding: 14, gap: 6,
    },
    statCardWide: { width: "100%" },
    statIcone: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
    statValue: { color: "#fff", fontSize: 20, fontWeight: "bold" },
    statLabel: { color: "#6B7280", fontSize: 11 },

    diaCard: {
        flexDirection: "row", alignItems: "center", gap: 12,
        backgroundColor: "#F9731615", borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: "#F9731630", marginBottom: 12,
    },
    diaLabel: { color: "#6B7280", fontSize: 12 },
    diaValue: { color: "#fff", fontWeight: "600", fontSize: 14 },

    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 10 },
    sectionTitle:  { fontSize: 17, fontWeight: "bold", color: "#fff" },
    verTodos:      { color: "#F5C518", fontSize: 13 },
    vazio:         { color: "#6B7280", textAlign: "center", marginTop: 10 },

    proximoCard: {
        flexDirection: "row", alignItems: "center", gap: 12,
        backgroundColor: "#1F2937", borderRadius: 12, padding: 12, marginBottom: 8,
        borderLeftWidth: 3, borderLeftColor: "#F5C518",
    },
    proximoHora:     { alignItems: "center", minWidth: 50 },
    proximoHoraText: { color: "#F5C518", fontWeight: "bold", fontSize: 15 },
    proximoDataText: { color: "#6B7280", fontSize: 10, marginTop: 2 },
    proximoCliente:  { color: "#fff", fontWeight: "600", fontSize: 14 },
    proximoServico:  { color: "#6B7280", fontSize: 12 },
    proximoPreco:    { color: "#10B981", fontWeight: "bold" },

    acaoRow: { flexDirection: "row", gap: 12, marginTop: 20 },
    acaoBtn: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
        backgroundColor: "#1F2937", borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: "#374151",
    },
    acaoBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
