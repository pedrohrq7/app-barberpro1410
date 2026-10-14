// src/app/barbeiro/gerenciar.jsx  —  Gerenciar serviços e horários do Barbeiro
import React, { useEffect, useState } from "react";
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, TextInput, Alert, Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HORARIOS_BASE } from "../../context/schedule";
import { useApp } from "../../context/AppContext";

export default function Gerenciar() {
    const { servicosBarbeiro, horariosBarbeiro, atualizarServicoBarbeiro, atualizarHorariosBarbeiro } = useApp();
    const [aba, setAba] = useState("servicos"); // "servicos" | "horarios"

    // Cópia local para refletir os dados carregados do backend.
    const [servicos, setServicos] = useState([]);

    // Estado local de horários disponíveis
    const [horariosAtivos, setHorariosAtivos] = useState({});

    // Edição de preço
    const [editando, setEditando] = useState(null); // id do serviço sendo editado
    const [novoPreco, setNovoPreco] = useState("");

    useEffect(() => setServicos(servicosBarbeiro), [servicosBarbeiro]);
    useEffect(() => setHorariosAtivos(HORARIOS_BASE.reduce((acc, h) => ({ ...acc, [h]: horariosBarbeiro.includes(h) }), {})), [horariosBarbeiro]);

    const salvarPreco = async (id) => {
        const p = parseFloat(novoPreco);
        if (isNaN(p) || p <= 0) { Alert.alert("Erro", "Preço inválido."); return; }
        const result = await atualizarServicoBarbeiro(id, { preco: p });
        if (!result.ok) { Alert.alert("Erro", result.erro); return; }
        setEditando(null);
        Alert.alert("✅ Salvo", "Preço atualizado com sucesso!");
    };

    const toggleServico = async (id) => {
        const service = servicos.find((item) => item.id === id);
        const result = await atualizarServicoBarbeiro(id, { ativo: !service.ativo });
        if (!result.ok) Alert.alert("Erro", result.erro);
    };

    const toggleHorario = (h) => {
        setHorariosAtivos(prev => ({ ...prev, [h]: !prev[h] }));
    };

    return (
        <View style={styles.container}>

            {/* Abas */}
            <View style={styles.abas}>
                <TouchableOpacity
                    style={[styles.aba, aba === "servicos" && styles.abaActive]}
                    onPress={() => setAba("servicos")}
                >
                    <Ionicons name="cut" size={16} color={aba === "servicos" ? "#111827" : "#6B7280"} />
                    <Text style={[styles.abaText, aba === "servicos" && styles.abaTextActive]}>
                        Serviços
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.aba, aba === "horarios" && styles.abaActive]}
                    onPress={() => setAba("horarios")}
                >
                    <Ionicons name="time" size={16} color={aba === "horarios" ? "#111827" : "#6B7280"} />
                    <Text style={[styles.abaText, aba === "horarios" && styles.abaTextActive]}>
                        Horários
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.lista}>

                {/* ── Serviços ── */}
                {aba === "servicos" && (
                    <>
                        <Text style={styles.hint}>Ative/desative serviços e edite os preços.</Text>
                        {servicos.map(s => (
                            <View key={s.id} style={[styles.card, !s.ativo && styles.cardInativo]}>
                                <View style={styles.cardTop}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.servicoNome, !s.ativo && styles.textoInativo]}>
                                            {s.nome}
                                        </Text>
                                        <Text style={styles.servicoInfo}>⏱ {s.duracao} min</Text>
                                    </View>
                                    <Switch
                                        value={s.ativo}
                                        onValueChange={() => toggleServico(s.id)}
                                        trackColor={{ false: "#374151", true: "#F5C51880" }}
                                        thumbColor={s.ativo ? "#F5C518" : "#6B7280"}
                                    />
                                </View>

                                {editando === s.id ? (
                                    <View style={styles.editRow}>
                                        <TextInput
                                            style={styles.precoInput}
                                            value={novoPreco}
                                            onChangeText={setNovoPreco}
                                            keyboardType="numeric"
                                            placeholder="Novo preço"
                                            placeholderTextColor="#4B5563"
                                            autoFocus
                                        />
                                        <TouchableOpacity style={styles.btnSalvar} onPress={() => salvarPreco(s.id)}>
                                            <Text style={styles.btnSalvarText}>Salvar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setEditando(null)} style={styles.btnCancelar}>
                                            <Ionicons name="close" size={18} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.precoRow}>
                                        <Text style={styles.preco}>R$ {s.preco}</Text>
                                        <TouchableOpacity
                                            style={styles.btnEditar}
                                            onPress={() => { setEditando(s.id); setNovoPreco(String(s.preco)); }}
                                            disabled={!s.ativo}
                                        >
                                            <Ionicons name="pencil" size={14} color={s.ativo ? "#F5C518" : "#374151"} />
                                            <Text style={[styles.btnEditarText, !s.ativo && { color: "#374151" }]}>
                                                Editar preço
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ))}
                    </>
                )}

                {/* ── Horários ── */}
                {aba === "horarios" && (
                    <>
                        <Text style={styles.hint}>
                            Selecione os horários em que você está disponível para atendimento.
                        </Text>
                        <View style={styles.horariosGrid}>
                            {HORARIOS_BASE.map(h => {
                                const ativo = horariosAtivos[h];
                                return (
                                    <TouchableOpacity
                                        key={h}
                                        style={[styles.horarioBtn, ativo && styles.horarioBtnActive]}
                                        onPress={() => toggleHorario(h)}
                                    >
                                        <Ionicons
                                            name={ativo ? "checkmark-circle" : "ellipse-outline"}
                                            size={14}
                                            color={ativo ? "#111827" : "#6B7280"}
                                        />
                                        <Text style={[styles.horarioBtnText, ativo && styles.horarioBtnTextActive]}>
                                            {h}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity
                            style={styles.btnSalvarHorarios}
                            onPress={async () => {
                                const result = await atualizarHorariosBarbeiro(HORARIOS_BASE.filter((h) => horariosAtivos[h]));
                                Alert.alert(result.ok ? "✅ Salvo" : "Erro", result.ok ? "Horários atualizados!" : result.erro);
                            }}
                        >
                            <Text style={styles.btnSalvarHorariosText}>Salvar horários</Text>
                        </TouchableOpacity>
                    </>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#111827" },

    abas: {
        flexDirection: "row", margin: 16, gap: 10,
        backgroundColor: "#1F2937", borderRadius: 14, padding: 4,
    },
    aba: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 6, paddingVertical: 10, borderRadius: 10,
    },
    abaActive: { backgroundColor: "#F5C518" },
    abaText:       { color: "#6B7280", fontWeight: "600", fontSize: 14 },
    abaTextActive: { color: "#111827" },

    lista: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
    hint:  { color: "#6B7280", fontSize: 13, marginBottom: 4 },

    card: {
        backgroundColor: "#1F2937", borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: "#374151", gap: 10,
    },
    cardInativo: { opacity: 0.5 },
    cardTop: { flexDirection: "row", alignItems: "center" },
    servicoNome: { color: "#fff", fontWeight: "600", fontSize: 15 },
    servicoInfo: { color: "#6B7280", fontSize: 12, marginTop: 2 },
    textoInativo: { color: "#4B5563" },

    precoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    preco:    { color: "#F5C518", fontSize: 18, fontWeight: "bold" },
    btnEditar: { flexDirection: "row", alignItems: "center", gap: 4 },
    btnEditarText: { color: "#F5C518", fontSize: 13 },

    editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    precoInput: {
        flex: 1, backgroundColor: "#111827", color: "#fff",
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
        fontSize: 15, borderWidth: 1, borderColor: "#F5C518",
    },
    btnSalvar: {
        backgroundColor: "#F5C518", borderRadius: 10,
        paddingVertical: 8, paddingHorizontal: 14,
    },
    btnSalvarText: { color: "#111827", fontWeight: "bold", fontSize: 13 },
    btnCancelar: { padding: 4 },

    horariosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
    horarioBtn: {
        flexDirection: "row", alignItems: "center", gap: 6,
        paddingVertical: 10, paddingHorizontal: 14,
        borderRadius: 10, backgroundColor: "#1F2937",
        borderWidth: 1.5, borderColor: "#374151",
    },
    horarioBtnActive: { backgroundColor: "#F5C518", borderColor: "#F5C518" },
    horarioBtnText:       { color: "#6B7280", fontWeight: "600" },
    horarioBtnTextActive: { color: "#111827" },

    btnSalvarHorarios: {
        backgroundColor: "#F5C518", borderRadius: 12,
        paddingVertical: 14, alignItems: "center", marginTop: 20, elevation: 4,
    },
    btnSalvarHorariosText: { color: "#111827", fontWeight: "bold", fontSize: 15 },
});
