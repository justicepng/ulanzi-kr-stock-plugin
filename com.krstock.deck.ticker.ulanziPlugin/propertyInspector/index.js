/**
 * Property Inspector for Ulanzi Studio - KR/Global Stock & Macro (v1.3.0)
 */

const LOCAL_RELAY_BASE = "http://127.0.0.1:18765";

const DEFAULT_SETTINGS = {
  stockCode: "005930",
  stockName: "삼성전자",
  refreshInterval: 10,
  urlMode: "naverPay",
  dataSource: "direct",
  showExchange: true,
};

const QUICK_PRESETS = [
  { code: "KOSPI",     name: "코스피",          market: "INDEX",   keywords: ["코스피", "kospi", "지수"] },
  { code: "KOSDAQ",    name: "코스닥",          market: "INDEX",   keywords: ["코스닥", "kosdaq", "지수"] },
  { code: "KPI200",    name: "코스피200",       market: "INDEX",   keywords: ["코스피200", "kospi200", "kpi200", "지수"] },
  { code: "NQcv1",     name: "나스닥100 선물",  market: "FUTURES", keywords: ["나스닥", "나스닥100", "나스닥선물", "선물", "nq", "nqcv1", "nq=f", "nasdaq"] },
  { code: "EScv1",     name: "S&P500 선물",     market: "FUTURES", keywords: ["s&p", "s&p500", "에스앤피", "선물", "es", "escv1", "es=f"] },
  { code: "YMcv1",     name: "다우 선물",       market: "FUTURES", keywords: ["다우", "다우선물", "선물", "ym", "ymcv1", "ym=f", "dow"] },
  { code: "RTYcv1",    name: "러셀2000 선물",   market: "FUTURES", keywords: ["러셀", "러셀2000", "선물", "rty", "rtycv1", "rty=f"] },
  { code: ".IXIC",     name: "나스닥 종합",     market: "US IDX",  keywords: ["나스닥", "나스닥종합", "ixic", "nasdaq", "지수"] },
  { code: ".NDX",      name: "나스닥 100",      market: "US IDX",  keywords: ["나스닥", "나스닥100", "ndx", "nasdaq", "지수"] },
  { code: ".INX",      name: "S&P 500",         market: "US IDX",  keywords: ["s&p", "s&p500", "에스앤피", "inx", "gspc", "지수"] },
  { code: ".DJI",      name: "다우존스",        market: "US IDX",  keywords: ["다우", "다우존스", "dji", "dow", "지수"] },
  { code: ".SOX",      name: "필라델피아반도체", market: "US IDX",  keywords: ["반도체", "필라델피아", "sox", "지수"] },
  { code: "CL=F",      name: "WTI 원유",        market: "OIL",     keywords: ["wti", "원유", "유가", "오일", "oil", "cl=f", "원자재", "에너지", "매크로"] },
  { code: "BZ=F",      name: "브렌트유",        market: "OIL",     keywords: ["브렌트", "브렌트유", "원유", "유가", "오일", "bz=f", "원자재", "에너지", "매크로"] },
  { code: "NG=F",      name: "천연가스",        market: "ENERGY",  keywords: ["천연가스", "가스", "ng=f", "원자재", "에너지", "매크로"] },
  { code: "GC=F",      name: "국제 금(Gold)",   market: "METALS",  keywords: ["금", "금값", "골드", "gold", "gc=f", "원자재", "귀금속", "매크로"] },
  { code: "SI=F",      name: "국제 은(Silver)", market: "METALS",  keywords: ["은", "은값", "실버", "silver", "si=f", "원자재", "귀금속", "매크로"] },
  { code: "HG=F",      name: "구리 선물",       market: "METALS",  keywords: ["구리", "코퍼", "copper", "hg=f", "원자재", "매크로"] },
  { code: "^TNX",      name: "미 10년 국채",    market: "BOND",    keywords: ["국채", "미10년", "10년물", "금리", "채권", "tnx", "us10y", "매크로"] },
  { code: "^TYX",      name: "미 30년 국채",    market: "BOND",    keywords: ["국채", "미30년", "30년물", "금리", "채권", "tyx", "us30y", "매크로"] },
  { code: "DX-Y.NYB",  name: "달러인덱스",      market: "DXY",     keywords: ["달러인덱스", "달러", "dxy", "usdx", "환율", "매크로"] },
  { code: "FX_USDKRW", name: "원/달러 환율",    market: "FX",      keywords: ["환율", "달러", "원달러", "usdkrw", "fx", "krw", "매크로"] },
  { code: "JPY=X",     name: "달러/엔 환율",    market: "FX",      keywords: ["환율", "엔화", "달러엔", "usdjpy", "jpy", "매크로"] },
  { code: "EURUSD=X",  name: "유로/달러",       market: "FX",      keywords: ["환율", "유로", "유로달러", "eurusd", "eur", "매크로"] },
  { code: "^VIX",      name: "VIX 공포지수",    market: "VIX",     keywords: ["vix", "공포", "공포지수", "변동성", "지수", "매크로"] },
  { code: "BTC-USD",   name: "비트코인(USD)",   market: "CRYPTO",  keywords: ["비트코인", "btc", "코인", "암호화폐", "매크로"] },
];

const params = new URLSearchParams(window.location.search);
const wsAddress = params.get("address") || "127.0.0.1";
const wsPort = params.get("port") || "3906";
const uuid = params.get("uuid") || "com.krstock.deck.ticker.quote";
const actionid = params.get("actionid") || "";
const key = params.get("key") || "";

let $ws = null;
let $settings = Object.assign({}, DEFAULT_SETTINGS);

const els = {
  searchInput: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  searchResults: document.getElementById("searchResults"),
  stockCode: document.getElementById("stockCode"),
  applyCodeBtn: document.getElementById("applyCodeBtn"),
  dataSource: document.getElementById("dataSource"),
  refreshInterval: document.getElementById("refreshInterval"),
  urlMode: document.getElementById("urlMode"),
  showExchange: document.getElementById("showExchange"),
  refreshBtn: document.getElementById("refreshBtn"),
  openUrlBtn: document.getElementById("openUrlBtn"),
  statusText: document.getElementById("statusText"),
};

function setStatus(msg, type = "") {
  els.statusText.textContent = msg;
  els.statusText.className = "status-text" + (type ? " " + type : "");
}

function sendJson(obj) {
  if ($ws && $ws.readyState === WebSocket.OPEN) {
    $ws.send(JSON.stringify(obj));
  }
}

function saveSettings(partial) {
  $settings = Object.assign({}, $settings, partial);
  sendJson({
    cmd: "paramfromplugin",
    uuid,
    key,
    actionid,
    param: $settings,
  });
}

function syncUi() {
  els.stockCode.value = $settings.stockCode || "005930";
  els.dataSource.value = $settings.dataSource || "direct";
  els.refreshInterval.value = String($settings.refreshInterval ?? 10);
  els.urlMode.value = $settings.urlMode || "naverPay";
  els.showExchange.checked = $settings.showExchange !== false;
}

async function performSearch() {
  const query = els.searchInput.value.trim();
  if (!query) {
    setStatus("검색할 종목명, 지수, 매크로 키워드를 입력하세요.", "error");
    return;
  }
  setStatus("종목 검색 중...");
  const qLower = query.toLowerCase();
  const presetHits = QUICK_PRESETS.filter(
    (p) =>
      p.name.toLowerCase().includes(qLower) ||
      p.code.toLowerCase().includes(qLower) ||
      p.keywords.some((k) => k.includes(qLower))
  );

  let naverHits = [];
  const mode = $settings.dataSource || "direct";
  try {
    let data = null;
    if (mode === "relay") {
      const res = await fetch(`${LOCAL_RELAY_BASE}/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
      if (res.ok) data = await res.json();
    } else if (mode === "auto") {
      try {
        const res = await fetch(`${LOCAL_RELAY_BASE}/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
        if (res.ok) data = await res.json();
      } catch {
        const res = await fetch(`https://ac.stock.naver.com/ac?q=${encodeURIComponent(query)}&target=stock`, { cache: "no-store" });
        if (res.ok) data = await res.json();
      }
    } else {
      const res = await fetch(`https://ac.stock.naver.com/ac?q=${encodeURIComponent(query)}&target=stock`, { cache: "no-store" });
      if (res.ok) data = await res.json();
    }
    const rawItems = data?.result?.items || data?.items || [];
    naverHits = (Array.isArray(rawItems) ? rawItems : [])
      .filter((it) => it.nationCode === "KOR" && it.code)
      .map((it) => ({
        code: it.code,
        name: it.name,
        market: it.typeCode || it.typeName || "KRX",
      }));
  } catch {
    // ignore network error and still show presets
  }

  const seen = new Set();
  const combined = [];
  for (const item of [...presetHits, ...naverHits]) {
    const k = item.code.toUpperCase();
    if (seen.has(k)) continue;
    seen.add(k);
    combined.push(item);
  }

  els.searchResults.innerHTML = "";
  if (combined.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "검색 결과가 없습니다";
    els.searchResults.appendChild(opt);
    setStatus("일치하는 종목이나 지수를 찾지 못했습니다.", "error");
    return;
  }

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = `검색 결과 ${combined.length}건 중 선택...`;
  els.searchResults.appendChild(placeholder);

  combined.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item.code;
    opt.dataset.name = item.name;
    opt.textContent = `${item.name} (${item.code}) · ${item.market}`;
    els.searchResults.appendChild(opt);
  });

  setStatus(`${combined.length}건을 찾았습니다. 목록에서 선택하세요.`, "ok");
}

els.searchBtn.addEventListener("click", performSearch);
els.searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") performSearch();
});

els.searchResults.addEventListener("change", () => {
  const code = els.searchResults.value;
  if (!code) return;
  const opt = els.searchResults.options[els.searchResults.selectedIndex];
  const name = opt?.dataset?.name || "";
  els.stockCode.value = code;
  saveSettings({ stockCode: code, stockName: name });
  setStatus(`선택됨: ${name} (${code})`, "ok");
});

els.applyCodeBtn.addEventListener("click", () => {
  const code = els.stockCode.value.trim();
  if (!code) {
    setStatus("종목 코드를 입력하세요.", "error");
    return;
  }
  saveSettings({ stockCode: code, stockName: "" });
  setStatus(`종목 코드 ${code} 적용됨`, "ok");
});

els.stockCode.addEventListener("keydown", (e) => {
  if (e.key === "Enter") els.applyCodeBtn.click();
});

els.dataSource.addEventListener("change", () => {
  saveSettings({ dataSource: els.dataSource.value });
  const label = els.dataSource.options[els.dataSource.selectedIndex]?.text || els.dataSource.value;
  setStatus(`데이터 소스 변경: ${label}`, "ok");
});

els.refreshInterval.addEventListener("change", () => {
  saveSettings({ refreshInterval: Number(els.refreshInterval.value) });
  setStatus("새로고침 주기가 저장되었습니다.", "ok");
});

els.urlMode.addEventListener("change", () => {
  saveSettings({ urlMode: els.urlMode.value });
  setStatus("클릭 시 이동 화면이 저장되었습니다.", "ok");
});

els.showExchange.addEventListener("change", () => {
  saveSettings({ showExchange: els.showExchange.checked });
});

els.refreshBtn.addEventListener("click", () => {
  sendJson({
    cmd: "paramfromplugin",
    uuid,
    key,
    actionid,
    param: { ...$settings, __cmd: "refreshNow" },
  });
  setStatus("시세를 새로고침했습니다.", "ok");
});

els.openUrlBtn.addEventListener("click", () => {
  const code = ($settings.stockCode || "005930").trim();
  let url = `https://stock.naver.com/domestic/stock/${code}`;
  let qParam = null;
  if ($settings.urlMode === "naverPayMobile") {
    url = `https://m.stock.naver.com/domestic/stock/${code}/total`;
  } else if ($settings.urlMode === "naverFinance") {
    url = "https://finance.naver.com/item/main.naver";
    qParam = { code };
  }
  sendJson({ cmd: "openurl", url, local: false, param: qParam });
});

function connect() {
  $ws = new WebSocket(`ws://${wsAddress}:${wsPort}`);
  $ws.onopen = () => {
    sendJson({ code: 0, cmd: "connected", actionid, key, uuid });
  };
  $ws.onmessage = (e) => {
    let data;
    try {
      data = JSON.parse(e.data);
    } catch {
      return;
    }
    if (data?.cmd === "paramfromapp" || data?.cmd === "paramfromplugin") {
      if (data.param && typeof data.param === "object" && !data.param.__cmd) {
        $settings = Object.assign({}, DEFAULT_SETTINGS, data.param);
        syncUi();
      }
    }
  };
  syncUi();
}

connect();
