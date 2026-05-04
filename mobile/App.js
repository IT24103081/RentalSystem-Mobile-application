import { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import { WebView } from "react-native-webview";

const DEFAULT_URL = process.env.EXPO_PUBLIC_WEB_APP_URL ?? "http://192.168.1.42:5173";

export default function App() {
  const [reloadToken, setReloadToken] = useState(0);
  const [error, setError] = useState("");

  const webUrl = DEFAULT_URL.trim();

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.kicker}>Rental System</Text>
        <Text style={styles.headerUrl} numberOfLines={1}>
          {webUrl}
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <WebView
        key={`${webUrl}-${reloadToken}`}
        source={{ uri: webUrl }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.webLoading}>
            <ActivityIndicator size="large" color="#f97316" />
            <Text style={styles.loadingText}>Loading rental system</Text>
          </View>
        )}
        onError={(event) => {
          setError(event.nativeEvent.description || "Unable to load the website.");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#0f172a"
  },
  loadingText: {
    color: "#cbd5e1",
    fontSize: 14
  },
  kicker: {
    color: "#fb923c",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase"
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.16)",
    backgroundColor: "#111827"
  },
  headerUrl: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "600"
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 12,
    lineHeight: 16
  },
  webLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#0f172a"
  }
});