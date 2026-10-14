// src/app/_layout.jsx
import { Stack, usePathname, useRouter } from "expo-router";
import { useColorScheme, View, StyleSheet, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { AppProvider, useApp } from "../context/AppContext";
import Header from "@/components/header";
import Navbar from "@/components/navbar";

const TELAS_PUBLICAS = ["/login", "/cadastro"];

// Guard interno — redireciona para login se não logado
function AuthGuard({ children }) {
    const { usuario, loading } = useApp();
    const pathname    = usePathname();
    const router      = useRouter();

    useEffect(() => {
        if (!loading && !usuario && !TELAS_PUBLICAS.includes(pathname)) {
            router.replace("/login");
        }
    }, [usuario, loading, pathname, router]);

    if (loading) return <View style={styles.loading}><ActivityIndicator color="#F5C518" size="large" /></View>;

    return children;
}

function LayoutInner() {
    const colorScheme = useColorScheme();
    const bg          = colorScheme === "dark" ? "#111827" : "#111827"; // sempre escuro
    const pathname    = usePathname();
    const esconder    = TELAS_PUBLICAS.includes(pathname);

    return (
        <View style={[styles.wrapper, { backgroundColor: bg }]}>
            {!esconder && <Header />}
            <Stack screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: { backgroundColor: bg },
            }} />
            {!esconder && <Navbar />}
        </View>
    );
}

export default function Layout() {
    return (
        <AppProvider>
            <AuthGuard>
                <LayoutInner />
            </AuthGuard>
        </AppProvider>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1 },
    loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111827" },
});
