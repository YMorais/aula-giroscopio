import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
} from "react-native";
import { Gyroscope } from "expo-sensors";

const { width, height } = Dimensions.get("window");

const PLAYER_SIZE = 110; // Foguete
const ASTEROID_SIZE = 50; // Asteroides
const GAME_TIME = 30; // segundos

import RocketImg from "../assets/images/rocket.png";
import SpaceBackground from "../assets/images/fundo.webp"; // Imagem de fundo

const generateAsteroidPosition = () => ({
  x: Math.random() * (width - ASTEROID_SIZE),
  y: -ASTEROID_SIZE,
});

export default function SpaceRunner() {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [playerPosition, setPlayerPosition] = useState({
    x: width / 2 - PLAYER_SIZE / 2,
    y: height - PLAYER_SIZE - 50,
  });
  const [asteroids, setAsteroids] = useState([generateAsteroidPosition()]);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);

  // --- Giroscópio ---
  useEffect(() => {
    if (gameState !== "playing") return;
    Gyroscope.setUpdateInterval(16);
    const sub = Gyroscope.addListener(setData);
    return () => sub.remove();
  }, [gameState]);

  // --- Movimento do foguete ---
  useEffect(() => {
    if (gameState !== "playing") return;
    let newX = playerPosition.x - data.y * 10;
    if (newX < 0) newX = 0;
    if (newX > width - PLAYER_SIZE) newX = width - PLAYER_SIZE;
    setPlayerPosition({ ...playerPosition, x: newX });
  }, [data]);

  // --- Asteroides ---
  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => {
      setAsteroids((prev) => {
        const newAsteroids = prev
          .map((a) => ({ x: a.x, y: a.y + 5 }))
          .filter((a) => a.y < height);
        if (Math.random() < 0.03) newAsteroids.push(generateAsteroidPosition());
        return newAsteroids;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [gameState]);

  // --- Colisão e pontuação ---
  useEffect(() => {
    if (gameState !== "playing") return;
    for (let a of asteroids) {
      const dx = playerPosition.x + PLAYER_SIZE / 2 - (a.x + ASTEROID_SIZE / 2);
      const dy = playerPosition.y + PLAYER_SIZE / 2 - (a.y + ASTEROID_SIZE / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < PLAYER_SIZE / 2 + ASTEROID_SIZE / 2) setGameState("gameover");
    }
    setScore((prev) => prev + 1);
  }, [asteroids]);

  // --- Timer ---
  useEffect(() => {
    if (gameState !== "playing") return;
    setTimeLeft(GAME_TIME);
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

  const startGame = () => {
    setPlayerPosition({ x: width / 2 - PLAYER_SIZE / 2, y: height - PLAYER_SIZE - 50 });
    setAsteroids([generateAsteroidPosition()]);
    setScore(0);
    setTimeLeft(GAME_TIME);
    setGameState("playing");
  };

  const restartGame = () => setGameState("start");

  return (
    <ImageBackground source={SpaceBackground} style={styles.container}>
      {/* --- Tela Inicial --- */}
      {gameState === "start" && (
        <View style={styles.center}>
          <Text style={styles.title}>🌌 Space Runner</Text>
          <Text style={styles.subtitle}>Desvie dos asteroides!</Text>
          <Image
            source={RocketImg}
            style={{ width: 200, height: 200, resizeMode: "contain", marginBottom: 20 }}
          />
          <TouchableOpacity style={styles.button} onPress={startGame}>
            <Text style={styles.buttonText}>🚀 Iniciar Corrida</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- Tela do Jogo --- */}
      {gameState === "playing" && (
        <>
          <Text style={styles.score}>⭐ Pontos: {score}</Text>
          <Text style={styles.timer}>⏱️ Tempo: {timeLeft}s</Text>

          <Image
            source={RocketImg}
            style={{
              position: "absolute",
              left: playerPosition.x,
              top: playerPosition.y,
              width: PLAYER_SIZE,
              height: PLAYER_SIZE,
              resizeMode: "contain",
            }}
          />

          {asteroids.map((a, i) => (
            <View key={i} style={[styles.asteroid, { left: a.x, top: a.y }]} />
          ))}
        </>
      )}

      {/* --- Tela de Fim --- */}
      {gameState === "gameover" && (
        <View style={styles.center}>
          <Text style={styles.title}>☄️ Corrida Finalizada!</Text>
          <Text style={styles.finalScore}>⭐ Pontos Finais: {score}</Text>
          <TouchableOpacity style={styles.button} onPress={restartGame}>
            <Text style={styles.buttonText}>🔄 Jogar Novamente</Text>
          </TouchableOpacity>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 32, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 15 },
  subtitle: { fontSize: 18, color: "#c5c6c7", textAlign: "center", marginBottom: 20 },
  button: { backgroundColor: "#1f2833", padding: 15, borderRadius: 10, marginTop: 10 },
  buttonText: { fontSize: 18, color: "#66fcf1", fontWeight: "bold", textAlign: "center" },
  asteroid: {
    position: "absolute",
    width: ASTEROID_SIZE,
    height: ASTEROID_SIZE,
    borderRadius: ASTEROID_SIZE / 2,
    backgroundColor: "#c5c6c7",
    borderWidth: 2,
    borderColor: "#fff",
  },
  score: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 22,
    color: "#f1c40f",
    fontWeight: "bold",
  },
  timer: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 20,
    color: "#e74c3c",
    fontWeight: "bold",
  },
  finalScore: { fontSize: 24, color: "#f1c40f", marginTop: 10 },
});
