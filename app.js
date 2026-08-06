// ==========================
// UTILITÁRIOS
// ==========================
const formatCurrency = (value) => {
  if (isNaN(value) || value === null) value = 0;
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const parseNumber = (value) => {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
};

const formatPercent = (value) => {
  if (isNaN(value) || value === null) value = 0;
  return value.toFixed(1).replace(".", ",") + "%";
};

const getCurrentDateString = () => {
  const now = new Date();
  return now.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const pad2 = (n) => (n < 10 ? "0" + n : "" + n);

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");

const getMonthLabel = (month) => {
  const labels = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return labels[parseInt(month || 0)] || "--";
};

const getPeriodLabel = () => {
  const mes = state.mes || "";
  const ano = state.ano || "";
  return mes && ano ? `${getMonthLabel(mes)}/${ano}` : "Período não informado";
};

const getDateLabel = () => {
  if (state.data) return state.data;
  return new Date().toLocaleDateString("pt-BR");
};

const getFileName = () => {
  const base = (state.descricao || "rateio-transporte").trim();
  const normalized = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${normalized || "rateio-transporte"}-${state.data || new Date().toISOString().slice(0, 10)}`;
};

const getRouteInsight = (rota) => {
  const alunos = rota.alunosIntegrais + rota.alunosDesconto * (1 - (rota.percDesconto || 0) / 100);
  const valorAluno = alunos > 0 ? state.calculo[rota.key === "curvelo" ? "valorAlunoCurvelo" : "valorAlunoSete"] : 0;
  return {
    alunos,
    valorAluno,
  };
};

// ==========================
// ESTADO GLOBAL
// ==========================
let state = {
  data: "",
  mes: "",
  ano: "",
  auxDinheiro: 0,
  auxCombustivel: 0,
  descricao: "",
  rotas: {
    curvelo: {
      alunosIntegrais: 0,
      alunosDesconto: 0,
      percDesconto: 0,
      passagens: 0,
      auxValor: 0,
      auxTipo: "nenhum",
      veiculos: [],
    },
    sete: {
      alunosIntegrais: 0,
      alunosDesconto: 0,
      percDesconto: 0,
      passagens: 0,
      auxValor: 0,
      auxTipo: "nenhum",
      veiculos: [],
    },
  },
  calculo: {
    brutoCurvelo: 0,
    brutoSete: 0,
    totalBruto: 0,
    percCurvelo: 0,
    percSete: 0,
    auxTotal: 0,
    auxCurvelo: 0,
    auxSete: 0,
    liquidoCurvelo: 0,
    liquidoSete: 0,
    alunosEqCurvelo: 0,
    alunosEqSete: 0,
    valorAlunoCurvelo: 0,
    valorAlunoSete: 0,
    totalRateado: 0,
    totalAlunosEq: 0,
    veiculosAtivos: 0,
  },
};

const STORAGE_KEY = "rateio_transporte_universitario";

// ==========================
// INICIALIZAÇÃO
// ==========================
const init = () => {
  document.getElementById("topbar-date").textContent = getCurrentDateString();
  initAnoSelects();
  initSidebarNavigation();
  initVeiculosButtons();
  initHeroActions();
  initActions();
  initTheme();
  loadFromStorageForCurrentPeriod();
  renderAll();
};

const initAnoSelects = () => {
  const anos = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 3; y <= currentYear + 2; y++) anos.push(y);

  const inputAno = document.getElementById("input-ano");
  const filtroAno = document.getElementById("filtro-ano");
  anos.forEach((y) => {
    const opt1 = document.createElement("option");
    opt1.value = y;
    opt1.textContent = y;
    inputAno.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = y;
    opt2.textContent = y;
    filtroAno.appendChild(opt2);
  });

  const now = new Date();
  document.getElementById("input-mes").value = now.getMonth() + 1;
  document.getElementById("input-ano").value = now.getFullYear();
  document.getElementById("filtro-mes").value = now.getMonth() + 1;
  document.getElementById("filtro-ano").value = now.getFullYear();
  document.getElementById("input-data").value = now.toISOString().slice(0, 10);
  updateTopbarPeriod();
};

const updateTopbarPeriod = () => {
  const mes = document.getElementById("filtro-mes").value;
  const ano = document.getElementById("filtro-ano").value;
  const labelMes = [
    "",
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const text = mes && ano ? `${labelMes[mes]}/${ano}` : "Sem período selecionado";
  document.getElementById("topbar-current-period").textContent = text;
};

// ==========================
// NAVEGAÇÃO SIDEBAR
// ==========================
const initSidebarNavigation = () => {
  const links = document.querySelectorAll(".sidebar-link[data-section]");
  links.forEach((link) => {
    link.addEventListener("click", () => {
      links.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
      const sectionId = link.getAttribute("data-section");
      showSection(sectionId);
    });
  });
};

const initHeroActions = () => {
  document.querySelector('[data-section-target="rateio"]')?.addEventListener("click", () => {
    showSection("rateio");
    document.querySelectorAll(".sidebar-link").forEach((l) => l.classList.remove("active"));
    document.querySelector('.sidebar-link[data-section="rateio"]').classList.add("active");
  });

  document.getElementById("btn-export-pdf-hero")?.addEventListener("click", exportPDF);
};

const THEME_STORAGE_KEY = "rateio_theme";

const applyTheme = (theme) => {
  const safeTheme = theme === "light" ? "light" : "dark";
  document.body.setAttribute("data-theme", safeTheme);
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.textContent = safeTheme === "light" ? "🌙" : "☀️";
    toggle.setAttribute("aria-label", safeTheme === "light" ? "Ativar tema escuro" : "Ativar tema claro");
  }
  localStorage.setItem(THEME_STORAGE_KEY, safeTheme);
};

const initTheme = () => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme(savedTheme || systemTheme);

  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const nextTheme = document.body.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(nextTheme);
    showToast(nextTheme === "light" ? "Tema claro ativado." : "Tema escuro ativado.");
  });
};

const showSection = (id) => {
  const sections = [
    "section-dashboard",
    "section-rateio",
    "section-relatorio",
    "section-historico",
  ];
  sections.forEach((sid) => {
    document.getElementById(sid).style.display =
      sid === "section-" + id ? "block" : "none";
  });
};

// ==========================
// VEÍCULOS
// ==========================
const initVeiculosButtons = () => {
  document.querySelectorAll("button[data-add-veiculo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const rota = btn.getAttribute("data-add-veiculo");
      addVeiculo(rota);
    });
  });
};

const addVeiculo = (rota) => {
  const nome = prompt("Nome do veículo (ex: Ônibus 01):");
  if (!nome) return;
  const diaria = parseNumber(prompt("Diária (R$):"));
  const dias = parseNumber(prompt("Dias:"));
  const veiculo = { id: Date.now(), nome, diaria, dias };
  state.rotas[rota].veiculos.push(veiculo);
  calcular();
  renderAll();
  showToast("Veículo adicionado com sucesso.");
};

const removeVeiculo = (rota, id) => {
  state.rotas[rota].veiculos = state.rotas[rota].veiculos.filter((v) => v.id !== id);
  calcular();
  renderAll();
};

// ==========================
// AÇÕES PRINCIPAIS
// ==========================
const initActions = () => {
  document.getElementById("btn-calcular").addEventListener("click", () => {
    readFormToState();
    calcular();
    renderAll();
    showToast("Cálculo atualizado.");
  });

  document.getElementById("btn-salvar").addEventListener("click", () => {
    readFormToState();
    calcular();
    saveToStorage();
    renderAll();
    showToast("Rateio salvo com sucesso.");
  });

  document.getElementById("btn-aplicar-filtro").addEventListener("click", () => {
    updateTopbarPeriod();
    loadFromStorageForCurrentPeriod();
    renderAll();
  });

  document
    .getElementById("btn-recarregar-historico")
    .addEventListener("click", () => {
      renderHistorico();
    });

  document.getElementById("btn-reset").addEventListener("click", () => {
    if (confirm("Tem certeza que deseja limpar todo o histórico?")) {
      localStorage.removeItem(STORAGE_KEY);
      loadFromStorageForCurrentPeriod();
      renderAll();
      showToast("Histórico limpo.");
    }
  });

  document.getElementById("btn-export-pdf").addEventListener("click", exportPDF);
};

// ==========================
// FORM -> STATE
// ==========================
const readFormToState = () => {
  state.data = document.getElementById("input-data").value;
  state.mes = document.getElementById("input-mes").value;
  state.ano = document.getElementById("input-ano").value;
  state.auxDinheiro = parseNumber(
    document.getElementById("input-aux-dinheiro").value
  );
  state.auxCombustivel = parseNumber(
    document.getElementById("input-aux-combustivel").value
  );
  state.descricao = document.getElementById("input-descricao").value;

  // Curvelo
  state.rotas.curvelo.alunosIntegrais = parseNumber(
    document.getElementById("curvelo-alunos-integrais").value
  );
  state.rotas.curvelo.alunosDesconto = parseNumber(
    document.getElementById("curvelo-alunos-desconto").value
  );
  state.rotas.curvelo.percDesconto = parseNumber(
    document.getElementById("curvelo-perc-desconto").value
  );
  state.rotas.curvelo.passagens = parseNumber(
    document.getElementById("curvelo-passagens").value
  );
  state.rotas.curvelo.auxValor = parseNumber(
    document.getElementById("curvelo-aux-valor").value
  );
  state.rotas.curvelo.auxTipo = document.getElementById("curvelo-aux-tipo").value || "nenhum";

  // Sete Lagoas
  state.rotas.sete.alunosIntegrais = parseNumber(
    document.getElementById("sete-alunos-integrais").value
  );
  state.rotas.sete.alunosDesconto = parseNumber(
    document.getElementById("sete-alunos-desconto").value
  );
  state.rotas.sete.percDesconto = parseNumber(
    document.getElementById("sete-perc-desconto").value
  );
  state.rotas.sete.passagens = parseNumber(
    document.getElementById("sete-passagens").value
  );
  state.rotas.sete.auxValor = parseNumber(
    document.getElementById("sete-aux-valor").value
  );
  state.rotas.sete.auxTipo = document.getElementById("sete-aux-tipo").value || "nenhum";
};

const writeStateToForm = () => {
  document.getElementById("input-data").value = state.data || "";
  document.getElementById("input-mes").value = state.mes || "";
  document.getElementById("input-ano").value = state.ano || "";
  document.getElementById("input-aux-dinheiro").value = state.auxDinheiro || "";
  document.getElementById("input-aux-combustivel").value =
    state.auxCombustivel || "";
  document.getElementById("input-descricao").value = state.descricao || "";

  document.getElementById("curvelo-alunos-integrais").value =
    state.rotas.curvelo.alunosIntegrais || "";
  document.getElementById("curvelo-alunos-desconto").value =
    state.rotas.curvelo.alunosDesconto || "";
  document.getElementById("curvelo-perc-desconto").value =
    state.rotas.curvelo.percDesconto || "";
  document.getElementById("curvelo-passagens").value =
    state.rotas.curvelo.passagens || "";

  document.getElementById("sete-alunos-integrais").value =
    state.rotas.sete.alunosIntegrais || "";
  document.getElementById("sete-alunos-desconto").value =
    state.rotas.sete.alunosDesconto || "";
  document.getElementById("sete-perc-desconto").value =
    state.rotas.sete.percDesconto || "";
  document.getElementById("sete-passagens").value =
    state.rotas.sete.passagens || "";
  document.getElementById("curvelo-aux-valor").value =
    state.rotas.curvelo.auxValor || "";
  document.getElementById("curvelo-aux-tipo").value =
    state.rotas.curvelo.auxTipo || "nenhum";
  document.getElementById("sete-aux-valor").value =
    state.rotas.sete.auxValor || "";
  document.getElementById("sete-aux-tipo").value =
    state.rotas.sete.auxTipo || "nenhum";
};

// ==========================
// LÓGICA DE CÁLCULO
// ==========================
const calcular = () => {
  const c = state.rotas.curvelo;
  const s = state.rotas.sete;

  const brutoCurvelo = c.veiculos.reduce(
    (sum, v) => sum + v.diaria * v.dias,
    0
  );
  const brutoSete = s.veiculos.reduce(
    (sum, v) => sum + v.diaria * v.dias,
    0
  );
  const totalBruto = brutoCurvelo + brutoSete;

  const percCurvelo = totalBruto ? (brutoCurvelo / totalBruto) * 100 : 0;
  const percSete = totalBruto ? (brutoSete / totalBruto) * 100 : 0;

  const auxTotal = state.auxDinheiro + state.auxCombustivel;

  const getAuxilioRota = (rota, bruto) => {
    if (rota.auxTipo === "fixo") return rota.auxValor || 0;
    if (rota.auxTipo === "percentual") return (bruto * ((rota.auxValor || 0) / 100));
    return 0;
  };

  const rotasComRegra = [
    { key: "curvelo", bruto: brutoCurvelo, rota: c },
    { key: "sete", bruto: brutoSete, rota: s },
  ].filter(({ rota }) => rota.auxTipo && rota.auxTipo !== "nenhum");

  const auxílioConfiguradoTotal = rotasComRegra.reduce((sum, { bruto, rota }) => {
    return sum + getAuxilioRota(rota, bruto);
  }, 0);

  const restanteAux = Math.max(0, auxTotal - auxílioConfiguradoTotal);
  const brutoRestante = rotasComRegra.length < 2
    ? 0
    : [
        { bruto: brutoCurvelo, rota: c },
        { bruto: brutoSete, rota: s },
      ].filter(({ rota }) => !rota.auxTipo || rota.auxTipo === "nenhum")
      .reduce((sum, { bruto }) => sum + bruto, 0);

  const auxCurvelo = c.auxTipo && c.auxTipo !== "nenhum"
    ? getAuxilioRota(c, brutoCurvelo)
    : (brutoRestante > 0 ? (restanteAux * brutoCurvelo) / brutoRestante : 0);
  const auxSete = s.auxTipo && s.auxTipo !== "nenhum"
    ? getAuxilioRota(s, brutoSete)
    : (brutoRestante > 0 ? (restanteAux * brutoSete) / brutoRestante : 0);

  const liquidoCurvelo = brutoCurvelo - auxCurvelo - (c.passagens || 0);
  const liquidoSete = brutoSete - auxSete - (s.passagens || 0);

  const alunosEqCurvelo =
    c.alunosIntegrais +
    c.alunosDesconto * (1 - (c.percDesconto || 0) / 100);
  const alunosEqSete =
    s.alunosIntegrais +
    s.alunosDesconto * (1 - (s.percDesconto || 0) / 100);

  const valorAlunoCurvelo =
    alunosEqCurvelo > 0 ? liquidoCurvelo / alunosEqCurvelo : 0;
  const valorAlunoSete =
    alunosEqSete > 0 ? liquidoSete / alunosEqSete : 0;

  const totalRateado = liquidoCurvelo + liquidoSete;
  const totalAlunosEq = alunosEqCurvelo + alunosEqSete;
  const veiculosAtivos = c.veiculos.length + s.veiculos.length;

  state.calculo = {
    brutoCurvelo,
    brutoSete,
    totalBruto,
    percCurvelo,
    percSete,
    auxTotal,
    auxCurvelo,
    auxSete,
    liquidoCurvelo,
    liquidoSete,
    alunosEqCurvelo,
    alunosEqSete,
    valorAlunoCurvelo,
    valorAlunoSete,
    totalRateado,
    totalAlunosEq,
    veiculosAtivos,
  };
};

// ==========================
// LOCALSTORAGE
// ==========================
const loadAllFromStorage = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
};

const saveAllToStorage = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

const saveToStorage = () => {
  const list = loadAllFromStorage();
  const key = `${state.ano}-${pad2(parseInt(state.mes || 0))}`;
  const existingIndex = list.findIndex((r) => r.key === key);
  const record = {
    key,
    createdAt: new Date().toISOString(),
    state,
  };
  if (existingIndex >= 0) {
    list[existingIndex] = record;
  } else {
    list.push(record);
  }
  saveAllToStorage(list);
};

const loadFromStorageForCurrentPeriod = () => {
  const mes = document.getElementById("filtro-mes").value;
  const ano = document.getElementById("filtro-ano").value;
  const key = `${ano}-${pad2(parseInt(mes || 0))}`;
  const list = loadAllFromStorage();
  const found = list.find((r) => r.key === key);
  if (found) {
    state = found.state;
    calcular();
    writeStateToForm();
  } else {
    const now = new Date();
    state = {
      data: "",
      mes: mes || (now.getMonth() + 1).toString(),
      ano: ano || now.getFullYear().toString(),
      auxDinheiro: 0,
      auxCombustivel: 0,
      descricao: "",
      rotas: {
        curvelo: {
          alunosIntegrais: 0,
          alunosDesconto: 0,
          percDesconto: 0,
          passagens: 0,
          auxValor: 0,
          auxTipo: "nenhum",
          veiculos: [],
        },
        sete: {
          alunosIntegrais: 0,
          alunosDesconto: 0,
          percDesconto: 0,
          passagens: 0,
          auxValor: 0,
          auxTipo: "nenhum",
          veiculos: [],
        },
      },
      calculo: state.calculo,
    };
    writeStateToForm();
    calcular();
  }
  renderHistorico();
};

// ==========================
// RENDERIZAÇÃO
// ==========================
let chartLine, chartPie, chartBar;
let pdfChartLine, pdfChartPie;

const renderAll = () => {
  renderVeiculosTables();
  renderDashboardCards();
  renderResumoDashboard();
  renderRelatorioTabela();
  renderRelatorioVeiculos();
  renderHistorico();
  renderPdfShell();
  renderCharts();
};

const renderVeiculosTables = () => {
  const curBody = document.getElementById("curvelo-veiculos-body");
  const seteBody = document.getElementById("sete-veiculos-body");
  curBody.innerHTML = "";
  seteBody.innerHTML = "";

  state.rotas.curvelo.veiculos.forEach((v) => {
    const tr = document.createElement("tr");
    const subtotal = v.diaria * v.dias;
    tr.innerHTML = `
      <td>${v.nome}</td>
      <td>${formatCurrency(v.diaria)}</td>
      <td>${v.dias}</td>
      <td>${formatCurrency(subtotal)}</td>
      <td><button class="btn btn-danger btn-sm">x</button></td>
    `;
    tr.querySelector("button").addEventListener("click", () =>
      removeVeiculo("curvelo", v.id)
    );
    curBody.appendChild(tr);
  });

  state.rotas.sete.veiculos.forEach((v) => {
    const tr = document.createElement("tr");
    const subtotal = v.diaria * v.dias;
    tr.innerHTML = `
      <td>${v.nome}</td>
      <td>${formatCurrency(v.diaria)}</td>
      <td>${v.dias}</td>
      <td>${formatCurrency(subtotal)}</td>
      <td><button class="btn btn-danger btn-sm">x</button></td>
    `;
    tr.querySelector("button").addEventListener("click", () =>
      removeVeiculo("sete", v.id)
    );
    seteBody.appendChild(tr);
  });

  document.getElementById("curvelo-bruto").textContent = formatCurrency(
    state.calculo.brutoCurvelo
  );
  document.getElementById("sete-bruto").textContent = formatCurrency(
    state.calculo.brutoSete
  );
};

const renderDashboardCards = () => {
  document.getElementById("card-total-rateado").textContent =
    formatCurrency(state.calculo.totalRateado);
  document.getElementById("card-total-alunos").textContent =
    state.calculo.totalAlunosEq.toFixed(2).replace(".", ",");
  document.getElementById("card-veiculos-ativos").textContent =
    state.calculo.veiculosAtivos;
  document.getElementById("card-auxilio-total").textContent =
    formatCurrency(state.calculo.auxTotal);
};

const renderResumoDashboard = () => {
  document.getElementById("resumo-bruto-curvelo").textContent =
    formatCurrency(state.calculo.brutoCurvelo);
  document.getElementById("resumo-bruto-sete").textContent =
    formatCurrency(state.calculo.brutoSete);
  document.getElementById("resumo-perc-curvelo").textContent =
    formatPercent(state.calculo.percCurvelo);
  document.getElementById("resumo-perc-sete").textContent =
    formatPercent(state.calculo.percSete);
  document.getElementById("resumo-aux-curvelo").textContent =
    formatCurrency(state.calculo.auxCurvelo);
  document.getElementById("resumo-aux-sete").textContent =
    formatCurrency(state.calculo.auxSete);
  document.getElementById("resumo-aluno-curvelo").textContent =
    formatCurrency(state.calculo.valorAlunoCurvelo);
  document.getElementById("resumo-aluno-sete").textContent =
    formatCurrency(state.calculo.valorAlunoSete);
};

const renderRelatorioTabela = () => {
  const tbody = document.getElementById("relatorio-body");
  tbody.innerHTML = "";

  const addRow = (descricao, cur, sete, obs = "") => {
    const tr = document.createElement("tr");
    const total = (cur || 0) + (sete || 0);
    tr.innerHTML = `
      <td>${descricao}</td>
      <td>${formatCurrency(cur || 0)}</td>
      <td>${formatCurrency(sete || 0)}</td>
      <td>${formatCurrency(total)}</td>
      <td>${obs}</td>
    `;
    tbody.appendChild(tr);
  };

  addRow("Bruto por rota", state.calculo.brutoCurvelo, state.calculo.brutoSete);
  addRow(
    "Passagens arrecadadas",
    state.rotas.curvelo.passagens,
    state.rotas.sete.passagens
  );
  addRow(
    "Auxílio distribuído",
    state.calculo.auxCurvelo,
    state.calculo.auxSete,
    "Proporcional ao bruto"
  );
  addRow(
    "Líquido após auxílio e passagens",
    state.calculo.liquidoCurvelo,
    state.calculo.liquidoSete
  );
  addRow(
    "Valor por aluno",
    state.calculo.valorAlunoCurvelo,
    state.calculo.valorAlunoSete,
    "Alunos equivalentes"
  );
  addRow(
    "Total rateado",
    state.calculo.liquidoCurvelo,
    state.calculo.liquidoSete,
    "Soma das rotas"
  );
};

const renderRelatorioVeiculos = () => {
  const tbody = document.getElementById("relatorio-veiculos-body");
  tbody.innerHTML = "";

  state.rotas.curvelo.veiculos.forEach((v) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>Curvelo</td>
      <td>${v.nome}</td>
      <td>${formatCurrency(v.diaria)}</td>
      <td>${v.dias}</td>
      <td>${formatCurrency(v.diaria * v.dias)}</td>
    `;
    tbody.appendChild(tr);
  });

  state.rotas.sete.veiculos.forEach((v) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>Sete Lagoas</td>
      <td>${v.nome}</td>
      <td>${formatCurrency(v.diaria)}</td>
      <td>${v.dias}</td>
      <td>${formatCurrency(v.diaria * v.dias)}</td>
    `;
    tbody.appendChild(tr);
  });
};

const renderHistorico = () => {
  const tbody = document.getElementById("historico-body");
  tbody.innerHTML = "";
  const list = loadAllFromStorage().sort((a, b) => a.key.localeCompare(b.key));

  const labelMes = [
    "",
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  list.forEach((r) => {
    const st = r.state;
    const tr = document.createElement("tr");
    const mesNum = parseInt(st.mes || 0);
    const periodo = (labelMes[mesNum] || "--") + "/" + (st.ano || "----");

    tr.innerHTML = `
      <td>${periodo}</td>
      <td>${st.data || "-"}</td>
      <td>${formatCurrency(st.calculo.brutoCurvelo)}</td>
      <td>${formatCurrency(st.calculo.brutoSete)}</td>
      <td>${formatCurrency(st.calculo.totalRateado)}</td>
      <td>${(st.calculo.totalAlunosEq || 0).toFixed(2).replace(".", ",")}</td>
      <td>${formatCurrency(st.calculo.auxTotal)}</td>
      <td>
        <button class="btn btn-outline btn-sm">Carregar</button>
      </td>
    `;
    tr.querySelector("button").addEventListener("click", () => {
      state = st;
      document.getElementById("input-mes").value = st.mes;
      document.getElementById("input-ano").value = st.ano;
      document.getElementById("filtro-mes").value = st.mes;
      document.getElementById("filtro-ano").value = st.ano;
      updateTopbarPeriod();
      writeStateToForm();
      calcular();
      renderAll();
      showSection("rateio");
      document
        .querySelectorAll(".sidebar-link")
        .forEach((l) => l.classList.remove("active"));
      document
        .querySelector('.sidebar-link[data-section="rateio"]')
        .classList.add("active");
    });
    tbody.appendChild(tr);
  });
};

// ==========================
// TOAST
// ==========================
const showToast = (message) => {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
};

// ==========================
// GRÁFICOS
// ==========================
const renderCharts = () => {
  const list = loadAllFromStorage().sort((a, b) => a.key.localeCompare(b.key));
  const labels = list.map((r) => {
    const st = r.state;
    const mesNum = parseInt(st.mes || 0);
    return `${getMonthLabel(st.mes)} / ${st.ano || "----"}`;
  });
  const dataRateado = list.map((r) => r.state.calculo.totalRateado || 0);

  const chartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `R$ ${ctx.formattedValue}` } },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v) => `R$ ${v}`,
        },
      },
    },
  };

  const lineDataset = {
    label: "Total rateado",
    data: dataRateado,
    borderColor: "#0ea5e9",
    backgroundColor: "rgba(14, 165, 233, 0.18)",
    tension: 0.3,
    fill: true,
    pointBackgroundColor: "#0284c7",
    pointRadius: 3,
  };

  const pieData = {
    labels: ["Curvelo", "Sete Lagoas"],
    datasets: [
      {
        data: [state.calculo.brutoCurvelo, state.calculo.brutoSete],
        backgroundColor: ["#2563eb", "#14b8a6"],
        borderWidth: 0,
      },
    ],
  };

  const lineCanvas = document.getElementById("chart-line");
  if (lineCanvas) {
    const ctxLine = lineCanvas.getContext("2d");
    if (chartLine) chartLine.destroy();
    chartLine = new Chart(ctxLine, {
      type: "line",
      data: { labels, datasets: [lineDataset] },
      options: chartConfig,
    });
  }

  const pieCanvas = document.getElementById("chart-pie");
  if (pieCanvas) {
    const ctxPie = pieCanvas.getContext("2d");
    if (chartPie) chartPie.destroy();
    chartPie = new Chart(ctxPie, {
      type: "pie",
      data: pieData,
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: "bottom" } } },
    });
  }

  const barCanvas = document.getElementById("chart-bar");
  if (barCanvas) {
    const ctxBar = barCanvas.getContext("2d");
    if (chartBar) chartBar.destroy();
    chartBar = new Chart(ctxBar, {
      type: "bar",
      data: {
        labels: ["Curvelo", "Sete Lagoas"],
        datasets: [
          {
            label: "Bruto",
            data: [state.calculo.brutoCurvelo, state.calculo.brutoSete],
            backgroundColor: ["#2563eb", "#14b8a6"],
            borderRadius: 8,
          },
        ],
      },
      options: chartConfig,
    });
  }

  const pdfLineCanvas = document.getElementById("pdf-chart-line");
  if (pdfLineCanvas) {
    const ctxPdfLine = pdfLineCanvas.getContext("2d");
    if (pdfChartLine) pdfChartLine.destroy();
    pdfChartLine = new Chart(ctxPdfLine, {
      type: "line",
      data: { labels, datasets: [lineDataset] },
      options: chartConfig,
    });
  }

  const pdfPieCanvas = document.getElementById("pdf-chart-pie");
  if (pdfPieCanvas) {
    const ctxPdfPie = pdfPieCanvas.getContext("2d");
    if (pdfChartPie) pdfChartPie.destroy();
    pdfChartPie = new Chart(ctxPdfPie, {
      type: "pie",
      data: pieData,
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: "bottom" } } },
    });
  }
};

// ==========================
// PDF
// ==========================
const renderPdfShell = () => {
  const container = document.getElementById("pdf-export-inner");
  if (!container) return;

  const cur = state.rotas.curvelo;
  const sete = state.rotas.sete;
  const curAlunosEq = cur.alunosIntegrais + cur.alunosDesconto * (1 - (cur.percDesconto || 0) / 100);
  const seteAlunosEq = sete.alunosIntegrais + sete.alunosDesconto * (1 - (sete.percDesconto || 0) / 100);
  const curDesconto = cur.alunosDesconto * (cur.percDesconto || 0) / 100;
  const seteDesconto = sete.alunosDesconto * (sete.percDesconto || 0) / 100;

  container.innerHTML = `
    <div class="pdf-export-card">
      <div class="pdf-header">
        <div class="pdf-badge">Relatório financeiro</div>
        <h1>${escapeHtml(state.descricao || "Rateio transporte universitário")}</h1>
        <p>${escapeHtml(getPeriodLabel())} • ${escapeHtml(getDateLabel())}</p>
      </div>

      <div class="pdf-pills">
        <span class="pdf-pill">Bruto Curvelo: ${formatCurrency(state.calculo.brutoCurvelo)}</span>
        <span class="pdf-pill">Bruto Sete Lagoas: ${formatCurrency(state.calculo.brutoSete)}</span>
        <span class="pdf-pill">Total rateado: ${formatCurrency(state.calculo.totalRateado)}</span>
      </div>

      <div class="pdf-grid">
        <div class="pdf-card">
          <h3>Critérios usados no cálculo</h3>
          <ul>
            <li>Bruto por rota: soma das diárias dos veículos cadastrados.</li>
            <li>Participação da rota no total bruto para distribuição do auxílio.</li>
            <li>Auxílio distribuído proporcionalmente ao bruto de cada rota.</li>
            <li>Líquido: bruto menos auxílio e menos passagens arrecadadas.</li>
            <li>Valor por aluno: líquido dividido pelos alunos equivalentes, considerando desconto.</li>
          </ul>
        </div>

        <div class="pdf-card">
          <h3>Resumo das rotas</h3>
          <div class="pdf-route-list">
            <div class="pdf-route-item">
              <strong>Curvelo</strong>
              <p>% sobre o bruto: ${formatPercent(state.calculo.percCurvelo)}</p>
              <p>Valor aluno com desconto: ${formatCurrency(state.calculo.valorAlunoCurvelo)}</p>
              <p>Alunos equivalentes: ${curAlunosEq.toFixed(2).replace(".", ",")}</p>
            </div>
            <div class="pdf-route-item">
              <strong>Sete Lagoas</strong>
              <p>% sobre o bruto: ${formatPercent(state.calculo.percSete)}</p>
              <p>Valor aluno com desconto: ${formatCurrency(state.calculo.valorAlunoSete)}</p>
              <p>Alunos equivalentes: ${seteAlunosEq.toFixed(2).replace(".", ",")}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="pdf-grid">
        <div class="pdf-card">
          <h3>Desenhos representativos</h3>
          <div class="pdf-map-grid">
            <div class="pdf-map-card">
              <svg viewBox="0 0 220 120" role="img" aria-label="Mapa simplificado de Curvelo">
                <rect x="8" y="8" width="204" height="104" rx="16" fill="#eef6ff" />
                <path d="M36 90 L56 58 L74 66 L94 46 L118 60 L144 34 L166 48 L184 32 L184 90 Z" fill="#60a5fa" />
                <path d="M44 88 L75 72 L104 80 L122 68 L154 78 L176 70" stroke="#0f172a" stroke-width="3" fill="none" stroke-linecap="round" />
                <circle cx="70" cy="46" r="8" fill="#0f766e" />
                <circle cx="142" cy="44" r="8" fill="#0f766e" />
              </svg>
              <span>Curvelo</span>
            </div>
            <div class="pdf-map-card">
              <svg viewBox="0 0 220 120" role="img" aria-label="Mapa simplificado de Sete Lagoas">
                <rect x="8" y="8" width="204" height="104" rx="16" fill="#ecfeff" />
                <path d="M34 84 L58 70 L80 78 L104 50 L126 62 L156 40 L182 56 L182 90 L34 90 Z" fill="#2dd4bf" />
                <path d="M48 82 L72 62 L98 72 L132 54 L158 66 L178 58" stroke="#0f172a" stroke-width="3" fill="none" stroke-linecap="round" />
                <circle cx="90" cy="58" r="7" fill="#0f766e" />
                <circle cx="160" cy="48" r="7" fill="#0f766e" />
              </svg>
              <span>Sete Lagoas</span>
            </div>
          </div>
        </div>

        <div class="pdf-card">
          <h3>Valores com desconto</h3>
          <div class="pdf-route-list">
            <div class="pdf-route-item">
              <strong>Curvelo</strong>
              <p>Desconto aplicado: ${formatCurrency(curDesconto)}</p>
              <p>Alunos com desconto: ${cur.alunosDesconto}</p>
              <p>% de desconto: ${formatPercent(cur.percDesconto)}</p>
            </div>
            <div class="pdf-route-item">
              <strong>Sete Lagoas</strong>
              <p>Desconto aplicado: ${formatCurrency(seteDesconto)}</p>
              <p>Alunos com desconto: ${sete.alunosDesconto}</p>
              <p>% de desconto: ${formatPercent(sete.percDesconto)}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="pdf-charts-grid">
        <div class="pdf-chart-card">
          <h3>Evolução do rateio</h3>
          <canvas id="pdf-chart-line"></canvas>
        </div>
        <div class="pdf-chart-card">
          <h3>Participação do bruto</h3>
          <canvas id="pdf-chart-pie"></canvas>
        </div>
      </div>

      <div class="pdf-footer">Gerado em ${new Date().toLocaleString("pt-BR")} • ${escapeHtml(getFileName())}</div>
    </div>
  `;

  renderCharts();
};

const exportPDF = async () => {
  renderPdfShell();
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");
  const shell = document.getElementById("pdf-export-inner");

  if (!shell) {
    showToast("Não foi possível gerar o PDF.");
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 160));

  const canvas = await html2canvas(shell, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });
  const imgData = canvas.toDataURL("image/png");

  const pageWidth = pdf.internal.pageSize.getWidth() - 20;
  const pageHeight = pdf.internal.pageSize.getHeight() - 20;
  const ratio = canvas.width / pageWidth;
  const imgHeight = canvas.height / ratio;
  const finalHeight = Math.min(imgHeight, pageHeight);
  const finalWidth = pageWidth;

  pdf.addImage(imgData, "PNG", 10, 10, finalWidth, finalHeight);

  const safeName = getFileName();
  pdf.save(`${safeName}.pdf`);
  showToast("PDF exportado com sucesso.");
};

// ==========================
// START
// ==========================
window.addEventListener("load", () => {
  init();
});
