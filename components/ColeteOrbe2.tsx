import React, { useState, useEffect } from "react";
import { StyleSheet, View, Dimensions, Text, TouchableOpacity } from "react-native";
import { Gyroscope } from "expo-sensors";

const { width, height } = Dimensions.get("window");
const PLAYER_SIZE = 50;
const ORB_SIZE = 30;
const GAME_TIME = 30; // tempo inicial (em segundos)

// Gera posição aleatória do orbe
const generateRandomPosition = () => {
  return {
    x: Math.random() * (width - ORB_SIZE),
    y: Math.random() * (height - ORB_SIZE),
  };
};

export default function App() {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [playerPosition, setPlayerPosition] = useState({
    x: width / 2,
    y: height / 2,
  });
  const [orbPosition, setOrbPosition] = useState(generateRandomPosition());
  const [score, setScore] = useState(0);

  const [gameState, setGameState] = useState("start"); 
  // "start" | "playing" | "gameover"

  const [timeLeft, setTimeLeft] = useState(GAME_TIME);

  // --- Sensor ---
  useEffect(() => {
    if (gameState !== "playing") return;

    Gyroscope.setUpdateInterval(16);
    const subscription = Gyroscope.addListener((gyroscopeData) => {
      setData(gyroscopeData);
    });

    return () => subscription.remove();
  }, [gameState]);

  // --- Movimento ---
  useEffect(() => {
    if (gameState !== "playing") return;

    let newX = playerPosition.x - data.y * 10;
    let newY = playerPosition.y - data.x * 10;

    if (newX < 0) newX = 0;
    if (newX > width - PLAYER_SIZE) newX = width - PLAYER_SIZE;
    if (newY < 0) newY = 0;
    if (newY > height - PLAYER_SIZE) newY = height - PLAYER_SIZE;

    setPlayerPosition({ x: newX, y: newY });
  }, [data]);

  // --- Colisão com orbe ---
  useEffect(() => {
    if (gameState !== "playing") return;

    const playerCenterX = playerPosition.x + PLAYER_SIZE / 2;
    const playerCenterY = playerPosition.y + PLAYER_SIZE / 2;
    const orbCenterX = orbPosition.x + ORB_SIZE / 2;
    const orbCenterY = orbPosition.y + ORB_SIZE / 2;

    const dx = playerCenterX - orbCenterX;
    const dy = playerCenterY - orbCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < PLAYER_SIZE / 2 + ORB_SIZE / 2) {
      setOrbPosition(generateRandomPosition());
      setScore((prev) => prev + 1);
    }
  }, [playerPosition]);

  // --- Timer ---
  useEffect(() => {
    if (gameState !== "playing") return;

    setTimeLeft(GAME_TIME); // reseta sempre que iniciar
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setGameState("gameover");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  // --- Iniciar / Reiniciar ---
  const startGame = () => {
    setScore(0);
    setPlayerPosition({ x: width / 2, y: height / 2 });
    setOrbPosition(generateRandomPosition());
    setTimeLeft(GAME_TIME);
    setGameState("playing");
  };

  const restartGame = () => {
    setGameState("start");
  };

  return (
    <View style={styles.container}>
      {/* --- Tela de Início --- */}
      {gameState === "start" && (
        <View style={styles.center}>
          <Text style={styles.title}>🎮 Orbe Collector</Text>
          <TouchableOpacity style={styles.button} onPress={startGame}>
            <Text style={styles.buttonText}>Iniciar Jogo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- Tela do Jogo --- */}
      {gameState === "playing" && (
        <>
          <Text style={styles.instructions}>Colete o orbe azul!</Text>
          <Text style={styles.score}>Placar: {score}</Text>
          <Text style={styles.timer}>⏱️ Tempo: {timeLeft}s</Text>

          <View
            style={[
              styles.orb,
              { left: orbPosition.x, top: orbPosition.y },
            ]}
          />

          <View
            style={[
              styles.player,
              { left: playerPosition.x, top: playerPosition.y },
            ]}
          />
        </>
      )}

      {/* --- Tela de Fim de Jogo --- */}
      {gameState === "gameover" && (
        <View style={styles.center}>
          <Text style={styles.title}>🏆 Fim de Jogo!</Text>
          <Text style={styles.finalScore}>Placar Final: {score}</Text>
          <TouchableOpacity style={styles.button} onPress={restartGame}>
            <Text style={styles.buttonText}>Voltar ao Início</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2c3e50",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  instructions: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 20,
    color: "#fff",
  },
  score: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    color: "#f1c40f",
  },
  timer: {
    position: "absolute",
    top: 120,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 20,
    color: "#e74c3c",
  },
  finalScore: {
    fontSize: 24,
    color: "#f1c40f",
    marginTop: 10,
  },
  player: {
    position: "absolute",
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    borderRadius: PLAYER_SIZE / 2,
    backgroundColor: "coral",
    borderWidth: 2,
    borderColor: "#fff",
  },
  orb: {
    position: "absolute",
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: "#3498db",
    borderWidth: 2,
    borderColor: "#fff",
  },
});
