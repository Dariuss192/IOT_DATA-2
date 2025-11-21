const API_URL = "https://iot-data-uun9.onrender.com/data";

let waNumber = localStorage.getItem("wa_number") || "";

// === Guardar número WhatsApp ===
document.getElementById("save_wa").onclick = () => {
  waNumber = document.getElementById("wa_number").value;
  localStorage.setItem("wa_number", waNumber);
  alert("Número guardado");
};

// === Alert manual ===
document.getElementById("force_send").onclick = () => {
  sendWhatsAppAlert("⚠️ Alerta manual enviada desde el dashboard IoT");
};

// === Audio ===
const alertSound = document.getElementById("alert_sound");

// === Gráficas con tema futurista ===
Chart.defaults.font.family = "Orbitron";
Chart.defaults.color = "#00ffff";

let chartTH = new Chart(document.getElementById("chart_th"), {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Temperatura (°C)",
        data: [],
        borderColor: "#ff00ff",
        backgroundColor: "rgba(255,0,255,0.2)",
        tension: 0.3
      },
      {
        label: "Humedad (%)",
        data: [],
        borderColor: "#00ffff",
        backgroundColor: "rgba(0,255,255,0.2)",
        tension: 0.3
      }
    ]
  },
  options: {
    responsive: true,
    plugins: { legend: { labels: { color: "#00ffff" } } },
    scales: {
      x: { ticks: { color: "#00ffff" }, grid: { color: "#00ffff22" } },
      y: { ticks: { color: "#00ffff" }, grid: { color: "#00ffff22" } }
    }
  }
});

let chartGL = new Chart(document.getElementById("chart_gl"), {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Gas",
        data: [],
        borderColor: "#ff7700",
        backgroundColor: "rgba(255,119,0,0.2)",
        tension: 0.3
      },
      {
        label: "Luz",
        data: [],
        borderColor: "#00ff77",
        backgroundColor: "rgba(0,255,119,0.2)",
        tension: 0.3
      }
    ]
  },
  options: {
    responsive: true,
    plugins: { legend: { labels: { color: "#00ffff" } } },
    scales: {
      x: { ticks: { color: "#00ffff" }, grid: { color: "#00ffff22" } },
      y: { ticks: { color: "#00ffff" }, grid: { color: "#00ffff22" } }
    }
  }
});

// === Funciones de UI ===
function updateBar(id, value, max) {
  const percent = Math.min(100, (value / max) * 100);
  const bar = document.getElementById(id);
  bar.style.width = percent + "%";
  bar.style.background = `linear-gradient(90deg, #00ffff, #ff00ff)`;
}

// WhatsApp alert
function sendWhatsAppAlert(msg) {
  if (!waNumber) return;
  window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`);
}

// === FETCH PRINCIPAL ===
async function fetchData() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (!data.length) return;
    const d = data[0];
    const timeLabel = new Date(d.timestamp).toLocaleTimeString();

    // Actualizar pantalla
    document.getElementById("temperature").innerText = `${d.temperature} °C`;
    document.getElementById("humidity").innerText = `${d.humidity} %`;
    document.getElementById("light").innerText = d.light;
    document.getElementById("gas").innerText = d.gas;
    document.getElementById("led_state").innerText = d.led_state ? "Encendido" : "Apagado";
    document.getElementById("last_update").innerText = timeLabel;

    // Barras
    updateBar("bar_temp", d.temperature, 100);
    updateBar("bar_hum", d.humidity, 100);
    updateBar("bar_light", d.light, 4095);
    updateBar("bar_gas", d.gas, 4095);

    // Análisis
    document.getElementById("analysis_temp").innerText =
      d.temperature > 50 ? "⚠️ Riesgo: demasiado caliente" :
      d.temperature < 5 ? "❄️ Muy frío" :
      "✔️ Temperatura normal";

    document.getElementById("analysis_hum").innerText =
      d.humidity > 80 ? "⚠️ Humedad muy alta" :
      d.humidity < 20 ? "⚠️ Muy seco" :
      "✔️ Humedad estable";

    document.getElementById("analysis_light").innerText =
      d.light < 500 ? "🌙 Ambiente oscuro" :
      "☀️ Buena iluminación";

    document.getElementById("analysis_gas").innerText =
      d.gas > 2000 ? "🔥 PELIGRO: posible fuga detectada" :
      "✔️ Gas estable";

    document.getElementById("analysis_led").innerText =
      d.led_state ? "LED encendido" : "LED apagado";

    // Alarma gas
    if (d.gas > 2000) {
      alertSound.play();
      sendWhatsAppAlert("🔥 *PELIGRO*: Nivel alto de gas detectado en la cocina.");
      document.body.style.background = "linear-gradient(135deg, #330000, #660033)";
    } else {
      document.body.style.background = "linear-gradient(135deg, #0f0c29, #302b63, #24243e)";
    }

    // Actualizar gráficas
    chartTH.data.labels.push(timeLabel);
    chartTH.data.datasets[0].data.push(d.temperature);
    chartTH.data.datasets[1].data.push(d.humidity);

    chartGL.data.labels.push(timeLabel);
    chartGL.data.datasets[0].data.push(d.gas);
    chartGL.data.datasets[1].data.push(d.light);

    // Limitar historial
    if (chartTH.data.labels.length > 20) {
      chartTH.data.labels.shift();
      chartTH.data.datasets.forEach(ds => ds.data.shift());
      chartGL.data.labels.shift();
      chartGL.data.datasets.forEach(ds => ds.data.shift());
    }

    chartTH.update();
    chartGL.update();

  } catch (err) {
    console.error("Error al obtener datos", err);
  }
}

fetchData();
setInterval(fetchData, 1000);
