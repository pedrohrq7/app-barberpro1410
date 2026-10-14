// src/app/agendamentos.jsx  —  Lista de agendamentos do Cliente
import React, { useState } from "react";
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Modal, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";

function ConfirmModal({ visivel, onConfirmar, onCancelar }) {
    return (
        <Modal transparent animationType="fade" visible={visivel}>
            <View style={mStyles.overlay}>
                <View style={mStyles.box}>
                    <Text style={mStyles.titulo}>Cancelar agendamento</Text>
                    <Text style={mStyles.mensagem}>Tem certeza que deseja cancelar?</Text>
                    <View style={mStyles.botoes}>
                        <TouchableOpacity style={mStyles.btnNao} onPress={onCancelar}>
                            <Text style={mStyles.btnNaoText}>Não</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={mStyles.btnSim} onPress={onConfirmar}>
                            <Text style={mStyles.btnSimText}>Sim, cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const mStyles = StyleSheet.create({
    overlay:  { flex: 1, backgroundColor: "#00000099", justifyContent: "center", alignItems: "center" },
    box:      { backgroundColor: "#1F2937", borderRadius: 20, padding: 24, width: "85%", maxWidth: 360, gap: 12, borderWidth: 1, borderColor: "#374151" },
    titulo:   { color: "#fff", fontSize: 18, fontWeight: "bold" },
    mensagem: { color: "#9CA3AF", fontSize: 14 },
    botoes:   { flexDirection: "row", gap: 10, marginTop: 8 },
    btnNao:   { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#374151", alignItems: "center" },
    btnNaoText:  { color: "#9CA3AF", fontWeight: "600" },
    btnSim:   { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#EF4444", alignItems: "center" },
    btnSimText:  { color: "#fff", fontWeight: "bold" },
});

const STATUS_CONFIG = {
    pendente:  { cor: "#F5C518", label: "Pendente",  icone: "time-outline" },
    concluido: { cor: "#10B981", label: "Concluído", icone: "checkmark-circle" },
    cancelado: { cor: "#EF4444", label: "Cancelado", icone: "close-circle" },
};

export default function Agendamentos() {
    const router = useRouter();
    const { usuario, agendamentosCliente, cancelarAgendamento, getBarbeiro, getServico } = useApp();

    const [filtro, setFiltro] = useState("todos"); // todos | pendente | concluido | cancelado

    const todos = agendamentosCliente(usuario.id).sort((a, b) => {
        const da = new Date(`${a.data}T${a.horario}`);
        const db = new Date(`${b.data}T${b.horario}`);
        return db - da; // mais recente primeiro
    });

    const filtrados = filtro === "todos" ? todos : todos.filter(a => a.status === filtro);

    const [modalVisivel, setModalVisivel] = useState(false);
    const [idParaCancelar, setIdParaCancelar] = useState(null);

    const handleCancelar = (id) => {
        setIdParaCancelar(id);
        setModalVisivel(true);
    };

    const confirmarCancelamento = async () => {
        const result = await cancelarAgendamento(idParaCancelar);
        if (!result.ok) Alert.alert("Erro", result.erro);
        setModalVisivel(false);
        setIdParaCancelar(null);
    };

    return (
        <View style={styles.container}>
            <ConfirmModal
                visivel={modalVisivel}
                onConfirmar={confirmarCancelamento}
                onCancelar={() => setModalVisivel(false)}
            />
            {/* Filtros */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosScroll}>
                <View style={styles.filtrosRow}>
                    {["todos", "pendente", "concluido", "cancelado"].map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filtroBtn, filtro === f && styles.filtroBtnActive]}
                            onPress={() => setFiltro(f)}
                        >
                            <Text style={[styles.filtroBtnText, filtro === f && styles.filtroBtnTextActive]}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <ScrollView contentContainerStyle={styles.lista}>
                {filtrados.length === 0 && (
                    <View style={styles.vazio}>
                        <Ionicons name="calendar-outline" size={48} color="#374151" />
                        <Text style={styles.vazioText}>Nenhum agendamento encontrado</Text>
                        <TouchableOpacity style={styles.btnNovo} onPress={() => router.push("/agendar")}>
                            <Text style={styles.btnNovoText}>Agendar agora</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {filtrados.map(ag => {
                    const barbeiro = getBarbeiro(ag.barbeiroId);
                    const servico  = getServico(ag.servicoId);
                    const cfg      = STATUS_CONFIG[ag.status];
                    const dataFmt  = new Date(ag.data + "T12:00:00").toLocaleDateString("pt-BR", {
                        weekday: "short", day: "2-digit", month: "short",
                    });

                    return (
                        <View key={ag.id} style={styles.card}>
                            {/* Status badge */}
                            <View style={[styles.statusBadge, { backgroundColor: cfg.cor + "20" }]}>
                                <Ionicons name={cfg.icone} size={14} color={cfg.cor} />
                                <Text style={[styles.statusText, { color: cfg.cor }]}>{cfg.label}</Text>
                            </View>

                            <Text style={styles.servicoNome}>{servico?.nome}</Text>

                            <View style={styles.infoRow}>
                                <Ionicons name="person" size={14} color="#6B7280" />
                                <Text style={styles.infoText}>{barbeiro?.nome}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="calendar" size={14} color="#6B7280" />
                                <Text style={styles.infoText}>{dataFmt} às {ag.horario}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="cash" size={14} color="#6B7280" />
                                <Text style={styles.infoText}>R$ {servico?.preco}</Text>
                            </View>

                            {ag.status === "pendente" && (
                                <TouchableOpacity
                                    style={styles.btnCancelar}
                                    onPress={() => handleCancelar(ag.id)}
                                >
                                    <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                                    <Text style={styles.btnCancelarText}>Cancelar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                })}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => router.push("/agendar")}>
                <Ionicons name="add" size={28} color="#111827" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#111827" },

    filtrosScroll: { maxHeight: 56, paddingTop: 10 },
    filtrosRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
    filtroBtn: {
        paddingVertical: 6, paddingHorizontal: 14,
        borderRadius: 20, backgroundColor: "#1F2937",
        borderWidth: 1, borderColor: "#374151",
    },
    filtroBtnActive: { backgroundColor: "#F5C518", borderColor: "#F5C518" },
    filtroBtnText:       { color: "#6B7280", fontSize: 13, fontWeight: "600" },
    filtroBtnTextActive: { color: "#111827" },

    lista: { padding: 16, gap: 12, paddingBottom: 100 },

    card: {
        backgroundColor: "#1F2937", borderRadius: 16,
        padding: 16, gap: 8,
        borderWidth: 1, borderColor: "#374151",
    },
    statusBadge: {
        flexDirection: "row", alignItems: "center", gap: 4,
        alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 10,
        borderRadius: 20,
    },
    statusText: { fontSize: 12, fontWeight: "600" },
    servicoNome: { fontSize: 17, fontWeight: "bold", color: "#fff" },
    infoRow:  { flexDirection: "row", alignItems: "center", gap: 6 },
    infoText: { color: "#9CA3AF", fontSize: 13 },

    btnCancelar: {
        flexDirection: "row", alignItems: "center", gap: 6,
        marginTop: 4, alignSelf: "flex-start",
        paddingVertical: 6, paddingHorizontal: 12,
        borderRadius: 8, borderWidth: 1, borderColor: "#EF444440",
        backgroundColor: "#EF444415",
    },
    btnCancelarText: { color: "#EF4444", fontSize: 13, fontWeight: "600" },

    vazio: { alignItems: "center", marginTop: 60, gap: 12 },
    vazioText: { color: "#6B7280", fontSize: 15 },
    btnNovo: {
        backgroundColor: "#F5C518", borderRadius: 12,
        paddingVertical: 10, paddingHorizontal: 24, marginTop: 4,
    },
    btnNovoText: { color: "#111827", fontWeight: "bold" },

    fab: {
        position: "absolute", bottom: 90, right: 20,
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: "#F5C518", justifyContent: "center", alignItems: "center",
        elevation: 8,
        shadowColor: "#F5C518", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5, shadowRadius: 8,
    },
});
