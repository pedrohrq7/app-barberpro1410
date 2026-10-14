// src/app/perfil.jsx  —  Perfil do Cliente
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { useRouter } from "expo-router";

export default function Perfil() {
    const router = useRouter();
    const { usuario, logout, agendamentosCliente, getBarbeiro, getServico } = useApp();

    if (!usuario) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#fff' }}>Carregando perfil...</Text>
            </View>
        );
    }

    const historico = agendamentosCliente(usuario.id)
        .filter(a => a.status === "concluido")
        .sort((a, b) => new Date(b.data) - new Date(a.data));

    const totalGasto = historico.reduce((acc, a) => {
        const s = a.servico || getServico(a.servicoId);
        return acc + (s ? s.preco : 0);
    }, 0);

    const handleLogout = () => {
        logout();
        router.replace("/login");
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

            {/* Avatar + info */}
            <View style={styles.avatarSection}>
                <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={44} color="#F5C518" />
                </View>
                <Text style={styles.nome}>{usuario.nome}</Text>
                <Text style={styles.email}>{usuario.email}</Text>
                <View style={styles.tipoBadge}>
                    <Ionicons name="person-circle" size={14} color="#111827" />
                    <Text style={styles.tipoText}>Cliente</Text>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statNum}>{historico.length}</Text>
                    <Text style={styles.statLabel}>Serviços</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNum}>R$ {totalGasto}</Text>
                    <Text style={styles.statLabel}>Total gasto</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNum}>
                        {new Set(historico.map(a => a.barbeiroId)).size}
                    </Text>
                    <Text style={styles.statLabel}>Barbeiros</Text>
                </View>
            </View>

            {/* Histórico */}
            <Text style={styles.sectionTitle}>Histórico de serviços</Text>
            {historico.length === 0 && (
                <Text style={styles.vazio}>Nenhum serviço concluído ainda.</Text>
            )}
            {historico.map(ag => {
                const barbeiro = getBarbeiro(ag.barbeiroId);
                const servico  = getServico(ag.servicoId);
                const dataFmt  = new Date(ag.data + "T12:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit", month: "short", year: "numeric",
                });
                return (
                    <View key={ag.id} style={styles.historicoItem}>
                        <View style={styles.historicoIcone}>
                            <Ionicons name="cut" size={18} color="#F5C518" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.historicoServico}>{servico?.nome}</Text>
                            <Text style={styles.historicoInfo}>{barbeiro?.nome} · {dataFmt}</Text>
                        </View>
                        <Text style={styles.historicoPreco}>R$ {servico?.preco}</Text>
                    </View>
                );
            })}

            {/* Botão sair */}
            <TouchableOpacity style={styles.btnSair} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text style={styles.btnSairText}>Sair da conta</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#111827" },
    scroll: { padding: 20, paddingBottom: 100 },

    avatarSection: { alignItems: "center", marginBottom: 24 },
    avatarCircle: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: "#1F2937", justifyContent: "center", alignItems: "center",
        borderWidth: 3, borderColor: "#F5C518", marginBottom: 12,
    },
    nome:  { fontSize: 22, fontWeight: "bold", color: "#fff" },
    email: { color: "#6B7280", fontSize: 14, marginTop: 4 },
    tipoBadge: {
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: "#F5C518", borderRadius: 20,
        paddingVertical: 4, paddingHorizontal: 12, marginTop: 8,
    },
    tipoText: { color: "#111827", fontWeight: "bold", fontSize: 12 },

    statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
    statCard: {
        flex: 1, backgroundColor: "#1F2937", borderRadius: 14,
        padding: 14, alignItems: "center", gap: 4,
    },
    statNum:   { color: "#F5C518", fontSize: 18, fontWeight: "bold" },
    statLabel: { color: "#6B7280", fontSize: 12 },

    sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 12 },
    vazio: { color: "#6B7280", textAlign: "center", marginTop: 20 },

    historicoItem: {
        flexDirection: "row", alignItems: "center", gap: 12,
        backgroundColor: "#1F2937", borderRadius: 12, padding: 14, marginBottom: 8,
    },
    historicoIcone: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: "#111827", justifyContent: "center", alignItems: "center",
    },
    historicoServico: { color: "#fff", fontWeight: "600", fontSize: 14 },
    historicoInfo:    { color: "#6B7280", fontSize: 12, marginTop: 2 },
    historicoPreco:   { color: "#F5C518", fontWeight: "bold" },

    btnSair: {
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
        marginTop: 32, padding: 14, borderRadius: 12,
        borderWidth: 1, borderColor: "#EF444440", backgroundColor: "#EF444415",
    },
    btnSairText: { color: "#EF4444", fontWeight: "bold", fontSize: 15 },
});
