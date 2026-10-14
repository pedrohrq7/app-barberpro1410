// src/app/cadastro.jsx
import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform,
    ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";

export default function Cadastro() {
    const router        = useRouter();
    const { cadastrar } = useApp();

    const [tipo,           setTipo]           = useState("cliente"); // "cliente" | "barbeiro"
    const [nome,           setNome]           = useState("");
    const [email,          setEmail]          = useState("");
    const [senha,          setSenha]          = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [loading,        setLoading]        = useState(false);

    const handleCadastro = async () => {
        if (!nome || !email || !senha || !confirmarSenha) {
            Alert.alert("Atenção", "Preencha todos os campos.");
            return;
        }
        if (senha !== confirmarSenha) {
            Alert.alert("Erro", "As senhas não coincidem.");
            return;
        }
        if (senha.length < 8) {
            Alert.alert("Erro", "A senha deve ter no mínimo 8 caracteres.");
            return;
        }
        setLoading(true);
        const result = await cadastrar(nome.trim(), email.trim(), senha, tipo);
        setLoading(false);
        if (result.ok) {
            router.replace(result.tipo === "barbeiro" ? "/barbeiro/dashboard" : "/");
        } else {
            Alert.alert("Erro", result.erro);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                {/* Logo */}
                <View style={styles.logoArea}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="cut" size={36} color="#111827" />
                    </View>
                    <Text style={styles.logoText}>BarberPro</Text>
                    <Text style={styles.logoSub}>Crie sua conta</Text>
                </View>

                {/* Seletor de tipo */}
                <View style={styles.tipoContainer}>
                    <Text style={styles.tipoTitle}>Você é:</Text>
                    <View style={styles.tipoRow}>
                        <TouchableOpacity
                            style={[styles.tipoBtn, tipo === "cliente" && styles.tipoBtnActive]}
                            onPress={() => setTipo("cliente")}
                        >
                            <Ionicons
                                name="person"
                                size={22}
                                color={tipo === "cliente" ? "#111827" : "#6B7280"}
                            />
                            <Text style={[styles.tipoBtnText, tipo === "cliente" && styles.tipoBtnTextActive]}>
                                Cliente
                            </Text>
                            <Text style={[styles.tipoDesc, tipo === "cliente" && styles.tipoDescActive]}>
                                Agende serviços
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tipoBtn, tipo === "barbeiro" && styles.tipoBtnActive]}
                            onPress={() => setTipo("barbeiro")}
                        >
                            <Ionicons
                                name="cut"
                                size={22}
                                color={tipo === "barbeiro" ? "#111827" : "#6B7280"}
                            />
                            <Text style={[styles.tipoBtnText, tipo === "barbeiro" && styles.tipoBtnTextActive]}>
                                Barbeiro
                            </Text>
                            <Text style={[styles.tipoDesc, tipo === "barbeiro" && styles.tipoDescActive]}>
                                Gerencie sua agenda
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.label}>Nome completo</Text>
                    <TextInput style={styles.input} placeholder="Seu nome" placeholderTextColor="#4B5563"
                        autoCapitalize="words" value={nome} onChangeText={setNome} />

                    <Text style={styles.label}>E-mail</Text>
                    <TextInput style={styles.input} placeholder="seuemail@exemplo.com" placeholderTextColor="#4B5563"
                        keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

                    <Text style={styles.label}>Senha</Text>
                    <TextInput style={styles.input} placeholder="Mínimo 6 caracteres" placeholderTextColor="#4B5563"
                        secureTextEntry value={senha} onChangeText={setSenha} />

                    <Text style={styles.label}>Confirmar senha</Text>
                    <TextInput style={styles.input} placeholder="Repita sua senha" placeholderTextColor="#4B5563"
                        secureTextEntry value={confirmarSenha} onChangeText={setConfirmarSenha} />

                    <TouchableOpacity style={styles.btnCadastro} onPress={handleCadastro} disabled={loading}>
                        {loading
                            ? <ActivityIndicator color="#111827" />
                            : <Text style={styles.btnCadastroText}>
                                Criar conta como {tipo === "cliente" ? "Cliente" : "Barbeiro"}
                              </Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push("/login")}>
                        <Text style={styles.linkText}>
                            Já tem conta?{" "}
                            <Text style={styles.linkDestaque}>Faça login</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#111827" },
    scroll: { flexGrow: 1, padding: 24, paddingBottom: 40 },

    logoArea: { alignItems: "center", marginBottom: 24, marginTop: 20 },
    logoCircle: {
        width: 70, height: 70, borderRadius: 35,
        backgroundColor: "#F5C518", justifyContent: "center", alignItems: "center",
        marginBottom: 10, elevation: 8,
    },
    logoText: { fontSize: 28, fontWeight: "bold", color: "#F5C518", letterSpacing: 3 },
    logoSub:  { color: "#6B7280", fontSize: 13, marginTop: 4 },

    tipoContainer: { marginBottom: 20 },
    tipoTitle: { color: "#9CA3AF", fontSize: 13, fontWeight: "600", marginBottom: 10, textAlign: "center" },
    tipoRow: { flexDirection: "row", gap: 12 },
    tipoBtn: {
        flex: 1, alignItems: "center", padding: 14,
        borderRadius: 14, borderWidth: 1.5, borderColor: "#374151",
        backgroundColor: "#1F2937", gap: 4,
    },
    tipoBtnActive: { backgroundColor: "#F5C518", borderColor: "#F5C518" },
    tipoBtnText: { color: "#6B7280", fontWeight: "bold", fontSize: 15 },
    tipoBtnTextActive: { color: "#111827" },
    tipoDesc: { color: "#4B5563", fontSize: 11 },
    tipoDescActive: { color: "#374151" },

    form: {
        backgroundColor: "#1F2937", borderRadius: 20, padding: 24, elevation: 8,
    },
    label: { color: "#9CA3AF", fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 14 },
    input: {
        backgroundColor: "#111827", color: "#fff",
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
        fontSize: 15, borderWidth: 1, borderColor: "#374151",
    },
    btnCadastro: {
        backgroundColor: "#F5C518", borderRadius: 12,
        paddingVertical: 15, alignItems: "center", marginTop: 24, elevation: 6,
    },
    btnCadastroText: { color: "#111827", fontWeight: "bold", fontSize: 15 },
    linkText: { color: "#6B7280", textAlign: "center", marginTop: 18, fontSize: 14 },
    linkDestaque: { color: "#F5C518", fontWeight: "bold" },
});
