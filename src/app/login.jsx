// src/app/login.jsx
import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform,
    ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";

export default function Login() {
    const router     = useRouter();
    const { login }  = useApp();

    const [email,   setEmail]   = useState("");
    const [senha,   setSenha]   = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !senha) {
            Alert.alert("Atenção", "Preencha todos os campos.");
            return;
        }
        setLoading(true);
        const result = await login(email.trim(), senha);
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
                        <Ionicons name="cut" size={40} color="#111827" />
                    </View>
                    <Text style={styles.logoText}>BarberPro</Text>
                    <Text style={styles.logoSub}>Seu estilo, nossa arte</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.label}>E-mail</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="seuemail@exemplo.com"
                        placeholderTextColor="#4B5563"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Text style={styles.label}>Senha</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#4B5563"
                        secureTextEntry
                        value={senha}
                        onChangeText={setSenha}
                    />

                    <TouchableOpacity style={styles.btnLogin} onPress={handleLogin} disabled={loading}>
                        {loading
                            ? <ActivityIndicator color="#111827" />
                            : <Text style={styles.btnLoginText}>Entrar</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push("/cadastro")}>
                        <Text style={styles.linkText}>
                            Não tem conta?{" "}
                            <Text style={styles.linkDestaque}>Cadastre-se</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#111827" },
    scroll: { flexGrow: 1, justifyContent: "center", padding: 24, paddingBottom: 40 },

    logoArea: { alignItems: "center", marginBottom: 32 },
    logoCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: "#F5C518",
        justifyContent: "center", alignItems: "center",
        marginBottom: 12,
        shadowColor: "#F5C518", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
    },
    logoText: { fontSize: 32, fontWeight: "bold", color: "#F5C518", letterSpacing: 3 },
    logoSub:  { color: "#6B7280", fontSize: 13, marginTop: 4 },

    demoRow: { marginBottom: 20 },
    demoLabel: { color: "#6B7280", fontSize: 12, marginBottom: 8, textAlign: "center" },
    demoButtons: { flexDirection: "row", justifyContent: "center", gap: 12 },
    demoBtn: {
        flexDirection: "row", alignItems: "center", gap: 6,
        borderWidth: 1, borderColor: "#F5C518",
        borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14,
    },
    demoBtnText: { color: "#F5C518", fontSize: 13, fontWeight: "600" },

    form: {
        backgroundColor: "#1F2937", borderRadius: 20, padding: 24,
        shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
    },
    label: { color: "#9CA3AF", fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 14 },
    input: {
        backgroundColor: "#111827", color: "#fff",
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
        fontSize: 15, borderWidth: 1, borderColor: "#374151",
    },
    btnLogin: {
        backgroundColor: "#F5C518", borderRadius: 12,
        paddingVertical: 15, alignItems: "center", marginTop: 24,
        shadowColor: "#F5C518", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
    },
    btnLoginText: { color: "#111827", fontWeight: "bold", fontSize: 16 },
    linkText: { color: "#6B7280", textAlign: "center", marginTop: 18, fontSize: 14 },
    linkDestaque: { color: "#F5C518", fontWeight: "bold" },
});
