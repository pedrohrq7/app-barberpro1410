// src/app/agendar.jsx  —  Fluxo de agendamento do Cliente
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useApp } from "../context/AppContext";

function SucessoModal({ visivel, servico, barbeiro, data, horario, onVoltar }) {
    return (
        <Modal transparent animationType="fade" visible={visivel}>
            <View style={mStyles.overlay}>
                <View style={mStyles.box}>
                    <View style={mStyles.iconeCircle}>
                        <Ionicons name="checkmark" size={32} color="#111827" />
                    </View>
                    <Text style={mStyles.titulo}>Agendado com sucesso!</Text>
                    <View style={mStyles.info}>
                        <Text style={mStyles.infoItem}>✂️ {servico?.nome}</Text>
                        <Text style={mStyles.infoItem}>👤 {barbeiro?.nome}</Text>
                        <Text style={mStyles.infoItem}>📅 {data?.label} às {horario}</Text>
                        <Text style={mStyles.infoPreco}>R$ {servico?.preco}</Text>
                    </View>
                    <TouchableOpacity style={mStyles.btn} onPress={onVoltar}>
                        <Text style={mStyles.btnText}>Ver meus agendamentos</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const mStyles = StyleSheet.create({
    overlay:     { flex: 1, backgroundColor: "#00000099", justifyContent: "center", alignItems: "center" },
    box:         { backgroundColor: "#1F2937", borderRadius: 20, padding: 24, width: "85%", maxWidth: 360, gap: 16, alignItems: "center", borderWidth: 1, borderColor: "#374151" },
    iconeCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#F5C518", justifyContent: "center", alignItems: "center" },
    titulo:      { color: "#fff", fontSize: 20, fontWeight: "bold", textAlign: "center" },
    info:        { width: "100%", backgroundColor: "#111827", borderRadius: 12, padding: 14, gap: 8 },
    infoItem:    { color: "#9CA3AF", fontSize: 14 },
    infoPreco:   { color: "#F5C518", fontWeight: "bold", fontSize: 16, marginTop: 4 },
    btn:         { backgroundColor: "#F5C518", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, width: "100%", alignItems: "center" },
    btnText:     { color: "#111827", fontWeight: "bold", fontSize: 15 },
});

const DIAS = (() => {
    const hoje = new Date();
    return Array.from({ length: 14 }, (_, i) => {
        const d = new Date(hoje);
        d.setDate(hoje.getDate() + i);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const label = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
        return { iso, label };
    });
})();

export default function Agendar() {
    const router = useRouter();
    const { criarAgendamento, horariosDisponiveis, servicosDoBarbeiro, barbeiros, servicos, getBarbeiro, getServico } = useApp();
    const params = useLocalSearchParams();

    const [step,      setStep]      = useState(params.barbeiroId ? 1 : params.servicoId ? 0 : 0);
    const [barbeiro,  setBarbeiro]  = useState(params.barbeiroId ? getBarbeiro(params.barbeiroId) : null);
    const [servico,   setServico]   = useState(params.servicoId  ? getServico(params.servicoId)   : null);
    const [data,      setData]      = useState(null);
    const [horario,   setHorario]   = useState(null);
    const [horarios,  setHorarios]  = useState([]);
    const [servicosProfissional, setServicosProfissional] = useState([]);
    const [loading,      setLoading]      = useState(false);
    const [modalVisivel, setModalVisivel] = useState(false);

    // Se veio com barbeiroId, pula para step 1 (escolher serviço)
    // Se veio com servicoId, começa no step 0 (escolher barbeiro)
    // step 0 = barbeiro, 1 = serviço, 2 = data, 3 = horário, 4 = confirmação

   const servicosDisponiveis = barbeiro ? servicosProfissional : servicos;

    useEffect(() => {
        let active = true;
        if (barbeiro?.id) {
            servicosDoBarbeiro(barbeiro.id).then((items) => { if (active) setServicosProfissional(items); });
        } else {
            setServicosProfissional([]);
        }
        return () => { active = false; };
    }, [barbeiro, servicosDoBarbeiro]);

    useEffect(() => {
        if (!servico) return;
        const updated = servicosDisponiveis.find((item) => item.id === servico.id);
        if (updated && updated.preco !== servico.preco) setServico(updated);
    }, [servicosDisponiveis, servico]);

    useEffect(() => {
        let active = true;
        if (barbeiro?.id && data?.iso && servico?.id) {
            horariosDisponiveis(barbeiro.id, data.iso, servico.id).then((items) => { if (active) setHorarios(items); });
        } else {
            setHorarios([]);
        }
        return () => { active = false; };
    }, [barbeiro, data, horariosDisponiveis, servico]);

    const confirmar = async () => {
        if (!barbeiro?.id || !servico?.id || !data?.iso || !horario) {
            Alert.alert("Atenção", "Por favor, selecione todas as informações do agendamento.");
            return;
        }
        setLoading(true);
        const result = await criarAgendamento({ barbeiroId: barbeiro.id, servicoId: servico.id, data: data.iso, horario });
        setLoading(false);
        if (result.ok) setModalVisivel(true);
        else Alert.alert("Não foi possível agendar", result.erro);
    };

    // ── Renderização por step ──
    const renderStep = () => {
        switch (step) {
            // STEP 0 — Escolher barbeiro
            case 0: return (
                <View style={styles.stepContainer}>
                    <Text style={styles.stepTitle}>Escolha o barbeiro</Text>
                    {barbeiros.map(b => (
                        <TouchableOpacity
                            key={b.id}
                            style={[styles.listItem, barbeiro?.id === b.id && styles.listItemActive]}
                            onPress={() => { setBarbeiro(b); setStep(1); }}
                        >
                            <View style={styles.avatarCircle}>
                                <Ionicons name="person" size={22} color="#F5C518" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.listItemTitle}>{b.nome}</Text>
                                <Text style={styles.listItemSub}>{b.especialidade}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
                        </TouchableOpacity>
                    ))}
                </View>
            );

            // STEP 1 — Escolher serviço
            case 1: return (
                <View style={styles.stepContainer}>
                    <Text style={styles.stepTitle}>Escolha o serviço</Text>
                    {servicosDisponiveis.map(s => (
                        <TouchableOpacity
                            key={s.id}
                            style={[styles.listItem, servico?.id === s.id && styles.listItemActive]}
                            onPress={() => { setServico(s); setStep(2); }}
                        >
                            <View style={styles.avatarCircle}>
                                <Ionicons name="cut" size={20} color="#F5C518" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.listItemTitle}>{s.nome}</Text>
                                <Text style={styles.listItemSub}>⏱ {s.duracao} min</Text>
                            </View>
                            <Text style={styles.preco}>R$ {s.preco}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );

            // STEP 2 — Escolher data
            case 2: return (
                <View style={styles.stepContainer}>
                    <Text style={styles.stepTitle}>Escolha a data</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.diasRow}>
                            {DIAS.map(d => (
                                <TouchableOpacity
                                    key={d.iso}
                                    style={[styles.diaBtn, data?.iso === d.iso && styles.diaBtnActive]}
                                    onPress={() => { setData(d); setStep(3); }}
                                >
                                    <Text style={[styles.diaBtnText, data?.iso === d.iso && styles.diaBtnTextActive]}>
                                        {d.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            );

            // STEP 3 — Escolher horário
            case 3: return (
                <View style={styles.stepContainer}>
                    <Text style={styles.stepTitle}>Horários disponíveis</Text>
                    {horarios.length === 0
                        ? <Text style={styles.vazio}>Nenhum horário disponível neste dia.</Text>
                        : (
                            <View style={styles.horariosGrid}>
                                {horarios.map(h => (
                                    <TouchableOpacity
                                        key={h}
                                        style={[styles.horarioBtn, horario === h && styles.horarioBtnActive]}
                                        onPress={() => { setHorario(h); setStep(4); }}
                                    >
                                        <Text style={[styles.horarioBtnText, horario === h && styles.horarioBtnTextActive]}>
                                            {h}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )
                    }
                </View>
            );

            // STEP 4 — Confirmação
            case 4: return (
                <View style={styles.stepContainer}>
                    <Text style={styles.stepTitle}>Confirmar agendamento</Text>
                    <View style={styles.resumoCard}>
                        <ResumoItem icon="cut"      label="Serviço"  value={servico?.nome} />
                        <ResumoItem icon="person"   label="Barbeiro" value={barbeiro?.nome} />
                        <ResumoItem icon="calendar" label="Data"     value={data?.label} />
                        <ResumoItem icon="time"     label="Horário"  value={horario} />
                        <View style={styles.resumoDivider} />
                        <ResumoItem icon="cash"     label="Total"    value={`R$ ${servico?.preco}`} destaque />
                    </View>
                    <TouchableOpacity style={styles.btnConfirmar} onPress={confirmar} disabled={loading}>
                        {loading
                            ? <ActivityIndicator color="#111827" />
                            : <Text style={styles.btnConfirmarText}>Confirmar Agendamento</Text>
                        }
                    </TouchableOpacity>
                </View>
            );

            default: return null;
        }
    };

    return (
        <View style={styles.container}>
            <SucessoModal
                visivel={modalVisivel}
                servico={servico}
                barbeiro={barbeiro}
                data={data}
                horario={horario}
                onVoltar={() => { setModalVisivel(false); router.replace("/agendamentos"); }}
            />
            {/* Header com steps */}
            <View style={styles.header}>
                {step > 0 && (
                    <TouchableOpacity onPress={() => setStep(s => s - 1)} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                )}
                <Text style={styles.headerTitle}>Novo Agendamento</Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBar}>
                {[0,1,2,3,4].map(i => (
                    <View key={i} style={[styles.progressStep, i <= step && styles.progressStepActive]} />
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {renderStep()}
            </ScrollView>
        </View>
    );
}

function ResumoItem({ icon, label, value, destaque }) {
    return (
        <View style={styles.resumoItem}>
            <Ionicons name={icon} size={16} color={destaque ? "#F5C518" : "#6B7280"} />
            <Text style={styles.resumoLabel}>{label}:</Text>
            <Text style={[styles.resumoValue, destaque && styles.resumoValueDestaque]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#111827" },

    header: {
        flexDirection: "row", alignItems: "center",
        padding: 16, paddingTop: 8, gap: 12,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: "#1F2937", justifyContent: "center", alignItems: "center",
    },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },

    progressBar: { flexDirection: "row", gap: 6, paddingHorizontal: 16, marginBottom: 8 },
    progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#1F2937" },
    progressStepActive: { backgroundColor: "#F5C518" },

    content: { padding: 16, paddingBottom: 100 },
    stepContainer: { gap: 12 },
    stepTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 8 },

    listItem: {
        flexDirection: "row", alignItems: "center", gap: 12,
        backgroundColor: "#1F2937", borderRadius: 14,
        padding: 14, borderWidth: 1.5, borderColor: "#374151",
    },
    listItemActive: { borderColor: "#F5C518" },
    avatarCircle: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: "#111827", justifyContent: "center", alignItems: "center",
    },
    listItemTitle: { color: "#fff", fontWeight: "600", fontSize: 15 },
    listItemSub:   { color: "#6B7280", fontSize: 12, marginTop: 2 },
    preco:         { color: "#F5C518", fontWeight: "bold", fontSize: 16 },

    diasRow: { flexDirection: "row", gap: 10, paddingVertical: 4 },
    diaBtn: {
        paddingVertical: 10, paddingHorizontal: 14,
        borderRadius: 12, backgroundColor: "#1F2937",
        borderWidth: 1.5, borderColor: "#374151",
    },
    diaBtnActive: { backgroundColor: "#F5C518", borderColor: "#F5C518" },
    diaBtnText:       { color: "#9CA3AF", fontSize: 13, fontWeight: "600" },
    diaBtnTextActive: { color: "#111827" },

    horariosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    horarioBtn: {
        paddingVertical: 10, paddingHorizontal: 18,
        borderRadius: 10, backgroundColor: "#1F2937",
        borderWidth: 1.5, borderColor: "#374151",
    },
    horarioBtnActive: { backgroundColor: "#F5C518", borderColor: "#F5C518" },
    horarioBtnText:       { color: "#9CA3AF", fontWeight: "600" },
    horarioBtnTextActive: { color: "#111827" },

    vazio: { color: "#6B7280", textAlign: "center", marginTop: 20 },

    resumoCard: {
        backgroundColor: "#1F2937", borderRadius: 16,
        padding: 20, gap: 12,
    },
    resumoItem:  { flexDirection: "row", alignItems: "center", gap: 8 },
    resumoLabel: { color: "#6B7280", fontSize: 14, width: 70 },
    resumoValue: { color: "#fff", fontSize: 14, fontWeight: "600", flex: 1 },
    resumoValueDestaque: { color: "#F5C518", fontSize: 16 },
    resumoDivider: { height: 1, backgroundColor: "#374151" },

    btnConfirmar: {
        backgroundColor: "#F5C518", borderRadius: 14,
        paddingVertical: 16, alignItems: "center", marginTop: 20, elevation: 6,
    },
    btnConfirmarText: { color: "#111827", fontWeight: "bold", fontSize: 16 },
});
