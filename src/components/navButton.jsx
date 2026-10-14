// Botão individual da navbar
// isActive → true quando a rota atual bate com o botão
// icon → recebe um Ionicons, a cor é trocada automaticamente via cloneElement

import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import React from "react";


export default function NavButton({icon, title, isActive, onPress}) {
    
    // Troca a cor do ícone dependendo se está ativo ou não
    const iconWithColor = React.cloneElement(icon, {
        color: isActive ? "#000000" : "#ffffff"  
    })

    return (
        <TouchableOpacity 
            style={styles.btnContainer} 
            onPress={onPress} 
            activeOpacity={0.3} 
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}
        }>

            {/* Círculo do botão — amarelo quando ativo, azul quando inativo */}
            <View style = {[styles.button, isActive && styles.buttonActive]}>
                {iconWithColor}
            </View>

            {/* Texto abaixo do botão */}
            <Text style = {[styles.btnText, isActive && styles.btnTextActive]}>{title}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    btnContainer: {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        marginTop: -30,
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5

    },

    button: {
        backgroundColor: "#1E3A8A", // azul inativo
        height: 50,
        borderRadius: 25,
        padding: 10
    },

    buttonActive: {
        backgroundColor: "#FACC15", // amarelo ativo
        marginBottom: 8,


    },

    btnText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 14,
        textShadowColor: "rgba(0,0,0,0.3)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2
    },

    btnTextActive: {
        fontSize: 16,            
        textShadowColor: "rgba(0,0,0,0.3)",
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 3
    }
})