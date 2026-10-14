// hooks/useAuth.js
// Hook responsável por toda autenticação do app
// Funções disponíveis: login, logout, register
// O token é salvo no AsyncStorage e persiste entre sessões
// isLogged → true se o usuário estiver autenticado

/* import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useAuth() {
    const [token, setToken] = useState(null)
    const [isLogged, setIsLogged] = useState(false)

    // Verifica se já existe token salvo ao abrir o app
    useEffect(() => {
        AsyncStorage.getItem("token").then(token => {
            setToken(token)
            setIsLogged(!!token)
        })
    }, [])

    // Salva o token após login bem sucedido
    // tokenValue → virá da resposta da API futuramente
    const login = async (tokenValue) => {
        await AsyncStorage.setItem("token", tokenValue)
        setToken(tokenValue)
        setIsLogged(true)
    }

    // Remove o token e desloga o usuário
    const logout = async () => {
        await AsyncStorage.removeItem("token")
        setToken(null)
        setIsLogged(false)
    }

    // TODO: implementar cadastro
    // register → chamar API, receber token e chamar login()
    const register = async (userData) => {}

    return { token, isLogged, login, logout, register }
} */

 