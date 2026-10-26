// Configurações globais para os gráficos
const chartOptions = {
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: "#f5f5f5",
      titleFontColor: "#333",
      bodyFontColor: "#666",
      bodySpacing: 4,
      padding: 12,
      mode: "nearest",
      intersect: false
    }
  },
  responsive: true,
  scales: {
    y: {
      grid: {
        drawBorder: false,
        color: "rgba(29,140,248,0.0)",
        zeroLineColor: "transparent"
      },
      ticks: {
        suggestedMin: 60,
        suggestedMax: 125,
        padding: 20,
        color: "#9a9a9a"
      }
    },
    x: {
      grid: {
        drawBorder: false,
        color: "rgba(29,140,248,0.1)",
        zeroLineColor: "transparent"
      },
      ticks: {
        padding: 20,
        color: "#9a9a9a"
      }
    }
  }
};

// Dados e configurações para os gráficos
const chartExample1 = {
  data: {
    labels: [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC"
    ],
    datasets: [
      {
        label: "My First dataset",
        fill: true,
        backgroundColor: "rgba(29,140,248,0.2)",
        borderColor: "#1f8ef1",
        borderWidth: 2,
        data: [100, 70, 90, 70, 85, 60, 75, 60, 90, 80, 110, 100]
      }
    ]
  },
  options: chartOptions
};

const chartExample2 = {
  data: {
    labels: ["JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
    datasets: [
      {
        label: "Data",
        fill: true,
        backgroundColor: "rgba(29,140,248,0.2)",
        borderColor: "#1f8ef1",
        borderWidth: 2,
        data: [80, 100, 70, 80, 120, 80]
      }
    ]
  },
  options: chartOptions
};

const chartExample3 = {
  data: {
    labels: ["USA", "GER", "AUS", "UK", "RO", "BR"],
    datasets: [
      {
        label: "Countries",
        fill: true,
        backgroundColor: "rgba(72,72,176,0.1)",
        borderColor: "#d048b6",
        borderWidth: 2,
        data: [53, 20, 10, 80, 100, 45]
      }
    ]
  },
  options: {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: "#f5f5f5",
        titleFontColor: "#333",
        bodyFontColor: "#666",
        bodySpacing: 4,
        padding: 12,
        mode: "nearest",
        intersect: false
      }
    },
    responsive: true,
    scales: {
      y: {
        grid: {
          drawBorder: false,
          color: "rgba(225,78,202,0.1)",
          zeroLineColor: "transparent"
        },
        ticks: {
          suggestedMin: 60,
          suggestedMax: 120,
          padding: 20,
          color: "#9e9e9e"
        }
      },
      x: {
        grid: {
          drawBorder: false,
          color: "rgba(225,78,202,0.1)",
          zeroLineColor: "transparent"
        },
        ticks: {
          padding: 20,
          color: "#9e9e9e"
        }
      }
    }
  }
};

const chartExample4 = {
  data: {
    labels: ["JUL", "AUG", "SEP", "OCT", "NOV"],
    datasets: [
      {
        label: "My First dataset",
        fill: true,
        backgroundColor: "rgba(66,134,121,0.15)",
        borderColor: "#00d6b4",
        borderWidth: 2,
        data: [90, 27, 60, 12, 80]
      }
    ]
  },
  options: {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: "#f5f5f5",
        titleFontColor: "#333",
        bodyFontColor: "#666",
        bodySpacing: 4,
        padding: 12,
        mode: "nearest",
        intersect: false
      }
    },
    responsive: true,
    scales: {
      y: {
        grid: {
          drawBorder: false,
          color: "rgba(29,140,248,0.0)",
          zeroLineColor: "transparent"
        },
        ticks: {
          suggestedMin: 50,
          suggestedMax: 125,
          padding: 20,
          color: "#9e9e9e"
        }
      },
      x: {
        grid: {
          drawBorder: false,
          color: "rgba(0,242,195,0.1)",
          zeroLineColor: "transparent"
        },
        ticks: {
          padding: 20,
          color: "#9e9e9e"
        }
      }
    }
  }
};

// Exportação
module.exports = {
  chartExample1,
  chartExample2,
  chartExample3,
  chartExample4
};
