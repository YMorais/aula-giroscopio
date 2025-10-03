import React, { useState, useEffect } from "react";
import { StyleSheet, View, Dimensions, Text, TouchableOpacity } from "react-native";
import { Gyroscope } from "expo-sensors";

// --- Configurações iniciais ---
const { width, height } = Dimensions.get("window"); // Pega as dimensões da tela
const PLAYER_SIZE = 50; // Tamanho do jogador (círculo controlado pelo giroscópio)
const ORB_SIZE = 30;    // Tamanho do orbe (círculo azul para coletar)
const GAME_TIME = 30;   // Tempo inicial do jogo (em segundos)

// --- Função para gerar posição aleatória do orbe ---
const generateRandomPosition = () => {
  return {
    x: Math.random() * (width - ORB_SIZE),
    y: Math.random() * (height - ORB_SIZE),
  };
};

export default function App() {
  // Estado para armazenar os dados do giroscópio
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });

  // Estado do jogador (posição na tela)
  const [playerPosition, setPlayerPosition] = useState({
    x: width / 2, // começa no meio da tela
    y: height / 2,
  });

  // Estado do orbe (posição aleatória inicial)
  const [orbPosition, setOrbPosition] = useState(generateRandomPosition());

  // Estado do placar
  const [score, setScore] = useState(0);

  // Estado do jogo (start | playing | gameover)
  const [gameState, setGameState] = useState("start");

  // Estado do tempo restante
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);

  // --- Sensor Giroscópio ---
  useEffect(() => {
    if (gameState !== "playing") return;

    // Atualiza os dados do giroscópio a cada 16ms
    Gyroscope.setUpdateInterval(16);
    const subscription = Gyroscope.addListener((gyroscopeData) => {
      setData(gyroscopeData); // Atualiza os dados do giroscópio
    });

    return () => subscription.remove(); // Remove quando parar
  }, [gameState]);

  // --- Movimento do jogador ---
  useEffect(() => {
    if (gameState !== "playing") return;

    // Movimento do jogador baseado no giroscópio
    let newX = playerPosition.x - data.y * 10;
    let newY = playerPosition.y - data.x * 10;

    // Impede que o jogador saia da tela
    if (newX < 0) newX = 0;
    if (newX > width - PLAYER_SIZE) newX = width - PLAYER_SIZE;
    if (newY < 0) newY = 0;
    if (newY > height - PLAYER_SIZE) newY = height - PLAYER_SIZE;

    setPlayerPosition({ x: newX, y: newY });
  }, [data]);

  // --- Colisão com o orbe ---
  useEffect(() => {
    if (gameState !== "playing") return;

    // Calcula a distância entre o jogador e o orbe
    const playerCenterX = playerPosition.x + PLAYER_SIZE / 2;
    const playerCenterY = playerPosition.y + PLAYER_SIZE / 2;
    const orbCenterX = orbPosition.x + ORB_SIZE / 2;
    const orbCenterY = orbPosition.y + ORB_SIZE / 2;

    const dx = playerCenterX - orbCenterX;
    const dy = playerCenterY - orbCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Se a distância for menor que a soma dos raios, houve colisão
    if (distance < PLAYER_SIZE / 2 + ORB_SIZE / 2) {
      setOrbPosition(generateRandomPosition()); // Gera novo orbe
      setScore((prev) => prev + 1); // Aumenta pontuação
    }
  }, [playerPosition]);

  // --- Timer do jogo ---
  useEffect(() => {
    if (gameState !== "playing") return;

    setTimeLeft(GAME_TIME); // Reseta tempo ao iniciar
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);   // Para o timer
          setGameState("gameover");  // Termina o jogo
          return 0;
        }
        return prev - 1; // Decrementa tempo
      });
    }, 1000);

    return () => clearInterval(interval); // Limpa intervalo
  }, [gameState]);

  // --- Função para iniciar o jogo ---
  const startGame = () => {
    setScore(0); // Reseta placar
    setPlayerPosition({ x: width / 2, y: height / 2 }); // Reposiciona jogador
    setOrbPosition(generateRandomPosition()); // Novo orbe
    setTimeLeft(GAME_TIME); // Reseta tempo
    setGameState("playing"); // Muda estado para jogando
  };

  // --- Função para reiniciar (voltar ao menu) ---
  const restartGame = () => {
    setGameState("start"); // Volta para tela inicial
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

          {/* Orbe (círculo azul) */}
          <View
            style={[
              styles.orb,
              { left: orbPosition.x, top: orbPosition.y },
            ]}
          />

          {/* Jogador (círculo coral) */}
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
    backgroundColor: "#2c3e50", // Fundo escuro
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
    backgroundColor: "coral", // Cor do jogador
    borderWidth: 2,
    borderColor: "#fff",
  },
  orb: {
    position: "absolute",
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: "#3498db", // Cor do orbe
    borderWidth: 2,
    borderColor: "#fff",
  },
});
