import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

// --- FARBY ---
const COLORS = {
  backgroundBlue: "#2C608A",
  cardWhite: "#FFFFFF",
  textDark: "#333333",
  labelGray: "#666666",
  inputBorder: "#D1D5DB",
  inputSuffixBg: "#EEEEEE",
  buttonBlue: "#337AB7",
};

// --- PREKLADY (Slovník) ---
const TRANSLATIONS = {
  en: {
    langName: "English",
    username: "Username",
    password: "Password",
    loginBtn: "Log in",
    requiredTitle: "Required",
    requiredMsg: "Please enter both username and password.",
    failTitle: "Login Failed",
    failMsg: "Incorrect credentials.\n(Try: student / 1234)",
  },
  pt: {
    langName: "Português",
    username: "Nome de utilizador",
    password: "Palavra-passe",
    loginBtn: "Entrar",
    requiredTitle: "Obrigatório",
    requiredMsg: "Por favor, insira o nome de utilizador e a palavra-passe.",
    failTitle: "Falha no login",
    failMsg: "Credenciais incorretas.\n(Tente: student / 1234)",
  },
};

export default function LoginScreen() {
  // Stav pre jazyk ('en' alebo 'pt')
  const [language, setLanguage] = useState<"en" | "pt">("en");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Skratka pre aktuálne texty
  const t = TRANSLATIONS[language];

  // Funkcia na prepnutie jazyka
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "pt" : "en"));
  };

  const handleLogin = () => {
    if (username.length === 0 || password.length === 0) {
      Alert.alert(t.requiredTitle, t.requiredMsg);
      return;
    }

    // MOCK LOGIN
    if (username === "student" && password === "1234") {
      // OKAMŽITÝ LOGIN BEZ ALERTU
      router.replace("/(tabs)");
    } else {
      Alert.alert(t.failTitle, t.failMsg);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.backgroundBlue}
      />

      {/* --- HLAVIČKA --- */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoTextNova}>NOVA</Text>
          <View>
            <Text style={styles.logoTextSubtitle}>FACULDADE DE</Text>
            <Text style={styles.logoTextSubtitle}>CIÊNCIAS E TECNOLOGIA</Text>
          </View>
        </View>

        {/* Prepínač jazyka (Funkčný) */}
        <TouchableOpacity
          style={styles.languageSelector}
          onPress={toggleLanguage}
          activeOpacity={0.7}
        >
          <Ionicons
            name="globe-outline"
            size={16}
            color="#555"
            style={{ marginRight: 5 }}
          />
          <Text style={styles.languageText}>{t.langName}</Text>
          <Ionicons
            name="swap-horizontal"
            size={16}
            color="#555"
            style={{ marginLeft: 5 }}
          />
        </TouchableOpacity>
      </View>

      {/* --- KARTA PRIHLÁSENIA --- */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.card}>
          {/* Username */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>{t.username}</Text>
              <Ionicons
                name="information-circle"
                size={16}
                color="black"
                style={{ marginLeft: 4 }}
              />
            </View>

            <View style={styles.usernameInputContainer}>
              <TextInput
                style={styles.usernameInput}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.suffixContainer}>
                <Text style={styles.suffixText}>@fct.unl.pt</Text>
              </View>
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.password}</Text>
            <TextInput
              style={styles.standardInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>{t.loginBtn}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundBlue,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 30,
    paddingTop: 20,
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoTextNova: {
    fontSize: 38,
    fontWeight: "bold",
    color: "white",
    marginRight: 10,
    letterSpacing: 2,
  },
  logoTextSubtitle: {
    fontSize: 12,
    color: "white",
    fontWeight: "500",
  },
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  languageText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
    minWidth: 60,
    textAlign: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: COLORS.cardWhite,
    width: "100%",
    maxWidth: 450,
    borderRadius: 8,
    paddingVertical: 30,
    paddingHorizontal: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: COLORS.labelGray,
    fontWeight: "400",
  },
  usernameInputContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 4,
    height: 45,
    overflow: "hidden",
  },
  usernameInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 16,
    color: COLORS.textDark,
    backgroundColor: "white",
  },
  suffixContainer: {
    backgroundColor: COLORS.inputSuffixBg,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.inputBorder,
  },
  suffixText: {
    color: COLORS.labelGray,
    fontSize: 16,
  },
  standardInput: {
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 4,
    height: 45,
    paddingHorizontal: 10,
    fontSize: 16,
    color: COLORS.textDark,
    marginTop: 8,
  },
  loginButton: {
    backgroundColor: COLORS.buttonBlue,
    height: 45,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
