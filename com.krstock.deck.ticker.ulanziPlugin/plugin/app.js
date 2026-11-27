/**
 * KR & Global Stock/Index/Futures/Macro Plugin for Ulanzi Studio (v1.3.0)
 * - Zero external dependencies (pure Node.js: net, crypto, https)
 * - Supports Korean stocks/ETFs/indices + Global indices/futures/FX/macro
 * - Renders 144x144 SVG icons and opens Naver Pay Securities on press
 */

import net from "net";
import crypto from "crypto";
import https from "https";

const PLUGIN_UUID = "com.krstock.deck.ticker";
const DEFAULT_SETTINGS = {
  stockCode: "005930",
  stockName: "삼성전자",
  refreshInterval: 10,
  urlMode: "naverPay",
  showExchange: true,
};

const DOMESTIC_INDICES = {
  KOSPI: { name: "코스피", market: "INDEX" },
  KOSDAQ: { name: "코스닥", market: "INDEX" },
  KPI200: { name: "코스피200", market: "INDEX" },
};

const GLOBAL_SYMBOLS = {
  NQCV1:     { name: "나스닥100 선물", market: "FUTURES", yahoo: "NQ=F",     naverUrl: "https://m.stock.naver.com/marketindex/futures/NQcv1", decimals: 2 },
  "NQ=F":    { name: "나스닥100 선물", market: "FUTURES", yahoo: "NQ=F",     naverUrl: "https://m.stock.naver.com/marketindex/futures/NQcv1", decimals: 2 },
  ESCV1:     { name: "S&P500 선물",   market: "FUTURES", yahoo: "ES=F",     naverUrl: "https://m.stock.naver.com/marketindex/futures/EScv1", decimals: 2 },
  "ES=F":    { name: "S&P500 선물",   market: "FUTURES", yahoo: "ES=F",     naverUrl: "https://m.stock.naver.com/marketindex/futures/EScv1", decimals: 2 },
  YMCV1:     { name: "다우 선물",     market: "FUTURES", yahoo: "YM=F",     naverUrl: "https://m.stock.naver.com/marketindex/futures/YMcv1", decimals: 2 },
  "YM=F":    { name: "다우 선물",     market: "FUTURES", yahoo: "YM=F",     naverUrl: "https://m.stock.naver.com/marketindex/futures/YMcv1", decimals: 2 },
  RTYCV1:    { name: "러셀2000 선물", market: "FUTURES", yahoo: "RTY=F",    naverUrl: "https://m.stock.naver.com/marketindex/futures/RTYcv1", decimals: 2 },
  "RTY=F":   { name: "러셀2000 선물", market: "FUTURES", yahoo: "RTY=F",    naverUrl: "https://m.stock.naver.com/marketindex/futures/RTYcv1", decimals: 2 },
  ".IXIC":   { name: "나스닥 종합",     market: "US IDX",  yahoo: "^IXIC",    naverUrl: "https://stock.naver.com/world/index/.IXIC", decimals: 2 },
  ".NDX":    { name: "나스닥 100",      market: "US IDX",  yahoo: "^NDX",     naverUrl: "https://stock.naver.com/world/index/.NDX", decimals: 2 },
  ".INX":    { name: "S&P 500",         market: "US IDX",  yahoo: "^GSPC",    naverUrl: "https://stock.naver.com/world/index/.INX", decimals: 2 },
  ".DJI":    { name: "다우존스",        market: "US IDX",  yahoo: "^DJI",     naverUrl: "https://stock.naver.com/world/index/.DJI", decimals: 2 },
  ".SOX":    { name: "필라델피아반도체", market: "US IDX",  yahoo: "^SOX",     naverUrl: "https://stock.naver.com/world/index/.SOX", decimals: 2 },
  FX_USDKRW: { name: "원/달러 환율",  market: "FX",      yahoo: "KRW=X",    naverUrl: "https://m.stock.naver.com/marketindex/exchange/FX_USDKRW", decimals: 2 },
  USDKRW:    { name: "원/달러 환율",  market: "FX",      yahoo: "KRW=X",    naverUrl: "https://m.stock.naver.com/marketindex/exchange/FX_USDKRW", decimals: 2 },
  "KRW=X":   { name: "원/달러 환율",  market: "FX",      yahoo: "KRW=X",    naverUrl: "https://m.stock.naver.com/marketindex/exchange/FX_USDKRW", decimals: 2 },
  "DX-Y.NYB":{ name: "달러인덱스",    market: "DXY",     yahoo: "DX-Y.NYB", naverUrl: "https://m.stock.naver.com/marketindex/exchange/FX_USDX", decimals: 2 },
  DXY:       { name: "달러인덱스",    market: "DXY",     yahoo: "DX-Y.NYB", naverUrl: "https://m.stock.naver.com/marketindex/exchange/FX_USDX", decimals: 2 },
  USDX:      { name: "달러인덱스",    market: "DXY",     yahoo: "DX-Y.NYB", naverUrl: "https://m.stock.naver.com/marketindex/exchange/FX_USDX", decimals: 2 },
  "JPY=X":   { name: "달러/엔 환율",  market: "FX",      yahoo: "JPY=X",    naverUrl: "https://m.stock.naver.com/marketindex/exchange/FX_USDJPY", decimals: 2 },
  USDJPY:    { name: "달러/엔 환율",  market: "FX",      yahoo: "JPY=X",    naverUrl: "https://m.stock.naver.com/marketindex/exchange/FX_USDJPY", decimals: 2 },
  "EURUSD=X":{ name: "유로/달러",     market: "FX",      yahoo: "EURUSD=X", naverUrl: "https://m.stock.naver.com/marketindex/exchange/FX_EURUSD", decimals: 4 },
  EURUSD:    { name: "유로/달러",     market: "FX",      yahoo: "EURUSD=X", naverUrl: "https://m.stock.naver.com/marketindex/exchange/FX_EURUSD", decimals: 4 },
  "CL=F":    { name: "WTI 원유",      market: "OIL",     yahoo: "CL=F",     naverUrl: "https://m.stock.naver.com/marketindex/energy/CLcv1", decimals: 2, prefix: "$" },
  CLCV1:     { name: "WTI 원유",      market: "OIL",     yahoo: "CL=F",     naverUrl: "https://m.stock.naver.com/marketindex/energy/CLcv1", decimals: 2, prefix: "$" },
  WTI:       { name: "WTI 원유",      market: "OIL",     yahoo: "CL=F",     naverUrl: "https://m.stock.naver.com/marketindex/energy/CLcv1", decimals: 2, prefix: "$" },
  "BZ=F":    { name: "브렌트유",      market: "OIL",     yahoo: "BZ=F",     naverUrl: "https://m.stock.naver.com/marketindex/energy/LCOcv1", decimals: 2, prefix: "$" },
  LCOCV1:    { name: "브렌트유",      market: "OIL",     yahoo: "BZ=F",     naverUrl: "https://m.stock.naver.com/marketindex/energy/LCOcv1", decimals: 2, prefix: "$" },
  BRENT:     { name: "브렌트유",      market: "OIL",     yahoo: "BZ=F",     naverUrl: "https://m.stock.naver.com/marketindex/energy/LCOcv1", decimals: 2, prefix: "$" },
  "NG=F":    { name: "천연가스",      market: "ENERGY",  yahoo: "NG=F",     naverUrl: "https://m.stock.naver.com/marketindex/energy/NGcv1", decimals: 3, prefix: "$" },
  NGCV1:     { name: "천연가스",      market: "ENERGY",  yahoo: "NG=F",     naverUrl: "https://m.stock.naver.com/marketindex/energy/NGcv1", decimals: 3, prefix: "$" },
  "GC=F":    { name: "국제 금(Gold)", market: "METALS",  yahoo: "GC=F",     naverUrl: "https://m.stock.naver.com/marketindex/metals/GCcv1", decimals: 2, prefix: "$" },
  GCCV1:     { name: "국제 금(Gold)", market: "METALS",  yahoo: "GC=F",     naverUrl: "https://m.stock.naver.com/marketindex/metals/GCcv1", decimals: 2, prefix: "$" },
  GOLD:      { name: "국제 금(Gold)", market: "METALS",  yahoo: "GC=F",     naverUrl: "https://m.stock.naver.com/marketindex/metals/GCcv1", decimals: 2, prefix: "$" },
  "SI=F":    { name: "국제 은(Silver)", market: "METALS", yahoo: "SI=F",    naverUrl: "https://m.stock.naver.com/marketindex/metals/SIcv1", decimals: 2, prefix: "$" },
  SICV1:     { name: "국제 은(Silver)", market: "METALS", yahoo: "SI=F",    naverUrl: "https://m.stock.naver.com/marketindex/metals/SIcv1", decimals: 2, prefix: "$" },
  SILVER:    { name: "국제 은(Silver)", market: "METALS", yahoo: "SI=F",    naverUrl: "https://m.stock.naver.com/marketindex/metals/SIcv1", decimals: 2, prefix: "$" },
  "HG=F":    { name: "구리 선물",     market: "METALS",  yahoo: "HG=F",     naverUrl: "https://m.stock.naver.com/marketindex/metals/HGcv1", decimals: 3, prefix: "$" },
  HGCV1:     { name: "구리 선물",     market: "METALS",  yahoo: "HG=F",     naverUrl: "https://m.stock.naver.com/marketindex/metals/HGcv1", decimals: 3, prefix: "$" },
  COPPER:    { name: "구리 선물",     market: "METALS",  yahoo: "HG=F",     naverUrl: "https://m.stock.naver.com/marketindex/metals/HGcv1", decimals: 3, prefix: "$" },
  "^TNX":    { name: "미 10년 국채",  market: "BOND",    yahoo: "^TNX",     naverUrl: "https://m.stock.naver.com/marketindex/bond/US10YT=RR", decimals: 3, suffix: "%" },
  US10Y:     { name: "미 10년 국채",  market: "BOND",    yahoo: "^TNX",     naverUrl: "https://m.stock.naver.com/marketindex/bond/US10YT=RR", decimals: 3, suffix: "%" },
  TNX:       { name: "미 10년 국채",  market: "BOND",    yahoo: "^TNX",     naverUrl: "https://m.stock.naver.com/marketindex/bond/US10YT=RR", decimals: 3, suffix: "%" },
  "^TYX":    { name: "미 30년 국채",  market: "BOND",    yahoo: "^TYX",     naverUrl: "https://m.stock.naver.com/marketindex/bond/US30YT=RR", decimals: 3, suffix: "%" },
  US30Y:     { name: "미 30년 국채",  market: "BOND",    yahoo: "^TYX",     naverUrl: "https://m.stock.naver.com/marketindex/bond/US30YT=RR", decimals: 3, suffix: "%" },
  TYX:       { name: "미 30년 국채",  market: "BOND",    yahoo: "^TYX",     naverUrl: "https://m.stock.naver.com/marketindex/bond/US30YT=RR", decimals: 3, suffix: "%" },
  "^VIX":    { name: "VIX 공포지수",  market: "VIX",     yahoo: "^VIX",     naverUrl: "https://finance.yahoo.com/quote/%5EVIX", decimals: 2 },
  VIX:       { name: "VIX 공포지수",  market: "VIX",     yahoo: "^VIX",     naverUrl: "https://finance.yahoo.com/quote/%5EVIX", decimals: 2 },
  "BTC-USD": { name: "비트코인(USD)", market: "CRYPTO",  yahoo: "BTC-USD",  naverUrl: "https://finance.yahoo.com/quote/BTC-USD", decimals: 0, prefix: "$" },
  BTC:       { name: "비트코인(USD)", market: "CRYPTO",  yahoo: "BTC-USD",  naverUrl: "https://finance.yahoo.com/quote/BTC-USD", decimals: 0, prefix: "$" },
};

// --- Minimal RFC 6455 WebSocket Client (no external ws package needed) ---

class SimpleWebSocket {
  constructor(host, port) {
    this.host = host;
    this.port = Number(port) || 3906;
    this.socket = null;
    this.buffer = Buffer.alloc(0);
    this.handshakeDone = false;
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    this.connect();
  }

  connect() {
    const key = crypto.randomBytes(16).toString("base64");
    this.socket = net.createConnection({ host: this.host, port: this.port }, () => {
      const req = [
        "GET / HTTP/1.1",
        `Host: ${this.host}:${this.port}`,
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Key: ${key}`,
        "Sec-WebSocket-Version: 13",
        "",
        "",
      ].join("\r\n");
      this.socket.write(req);
    });

    this.socket.on("data", (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      if (!this.handshakeDone) {
        const idx = this.buffer.indexOf("\r\n\r\n");
        if (idx === -1) return;
        const header = this.buffer.subarray(0, idx).toString("utf8");
        this.buffer = this.buffer.subarray(idx + 4);
        if (!header.includes("101")) {
          this.onerror?.(new Error("WebSocket handshake failed"));
          this.socket.destroy();
          return;
        }
        this.handshakeDone = true;
        this.onopen?.();
      }
      this.drainFrames();
    });

    this.socket.on("error", (err) => this.onerror?.(err));
    this.socket.on("close", () => this.onclose?.());
  }

  drainFrames() {
    while (this.buffer.length >= 2) {
      const b0 = this.buffer[0];
      const b1 = this.buffer[1];
      const opcode = b0 & 0x0f;
      const masked = (b1 & 0x80) !== 0;
      let len = b1 & 0x7f;
      let offset = 2;

      if (len === 126) {
        if (this.buffer.length < 4) return;
        len = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (len === 127) {
        if (this.buffer.length < 10) return;
        len = Number(this.buffer.readBigUInt64BE(2));
        offset = 10;
      }

      const maskLen = masked ? 4 : 0;
      if (this.buffer.length < offset + maskLen + len) return;

      let payload = this.buffer.subarray(offset + maskLen, offset + maskLen + len);
      if (masked) {
        const mask = this.buffer.subarray(offset, offset + 4);
        const unmasked = Buffer.alloc(len);
        for (let i = 0; i < len; i++) {
          unmasked[i] = payload[i] ^ mask[i % 4];
        }
        payload = unmasked;
      }

      this.buffer = this.buffer.subarray(offset + maskLen + len);

      if (opcode === 0x08) {
        this.close();
        return;
      } else if (opcode === 0x09) {
        this.sendFrame(0x0a, payload);
      } else if (opcode === 0x01 || opcode === 0x02) {
        this.onmessage?.({ data: payload.toString("utf8") });
      }
    }
  }

  sendFrame(opcode, dataBuf) {
    if (!this.socket || this.socket.destroyed || !this.handshakeDone) return;
    const len = dataBuf.length;
    const mask = crypto.randomBytes(4);
    let header;
    if (len < 126) {
      header = Buffer.alloc(2);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | len;
    } else if (len < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }
    const masked = Buffer.alloc(len);
    for (let i = 0; i < len; i++) {
      masked[i] = dataBuf[i] ^ mask[i % 4];
    }
    this.socket.write(Buffer.concat([header, mask, masked]));
  }

  send(str) {
    this.sendFrame(0x01, Buffer.from(str, "utf8"));
  }

  close() {
    if (this.socket && !this.socket.destroyed) {
      this.socket.end();
    }
  }
}

// --- HTTPS Helper ---

function fetchJson(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json, text/plain, */*",
        },
        timeout: timeoutMs,
      },
      (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("timeout", () => {
      req.destroy(new Error("Request timeout"));
    });
    req.on("error", reject);
  });
}

// --- Quote Fetching & Normalization ---

function isDomesticIndex(code) {
  return Object.prototype.hasOwnProperty.call(
    DOMESTIC_INDICES,
    String(code || "").trim().toUpperCase()
  );
}

function getGlobalMeta(code) {
  return GLOBAL_SYMBOLS[String(code || "").trim().toUpperCase()] || null;
}

function normalizeNaver(raw, code, isDomIdx) {
  const item = Array.isArray(raw?.datas) ? raw.datas[0] : raw;
  if (!item || item.closePrice === undefined || item.closePrice === null) return null;
  const upper = String(code || "").trim().toUpperCase();
  const idxMeta = isDomIdx ? DOMESTIC_INDICES[upper] : null;
  return {
    itemCode: item.itemCode || code,
    stockName: item.stockName || idxMeta?.name || code,
    closePrice: String(item.closePrice),
    compareToPreviousClosePrice: String(item.compareToPreviousClosePrice || "0"),
    fluctuationsRatio: String(item.fluctuationsRatio || "0"),
    compareToPreviousPrice: item.compareToPreviousPrice || { code: "3" },
    stockExchangeName: isDomIdx
      ? "INDEX"
      : item.stockExchangeName || item.stockExchangeType?.name || "KRX",
    marketStatus: item.marketStatus || "CLOSE",
    newPcUrl: isDomIdx
      ? `https://stock.naver.com/domestic/index/${upper}`
      : item.newPcUrl || `https://stock.naver.com/domestic/stock/${item.itemCode || code}`,
  };
}

function normalizeYahoo(raw, code, gMeta) {
  const yMeta = raw?.chart?.result?.[0]?.meta;
  if (!yMeta || yMeta.regularMarketPrice === undefined) return null;
  const price = Number(yMeta.regularMarketPrice);
  const prev = Number(yMeta.chartPreviousClose ?? yMeta.previousClose ?? price);
  const diff = price - prev;
  const ratio = prev > 0 ? (diff / prev) * 100 : 0;

  let dirCode = "3";
  if (diff > 0) dirCode = "2";
  else if (diff < 0) dirCode = "5";

  const decimals = gMeta ? gMeta.decimals : 2;
  const fmt = (n) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const prefix = gMeta?.prefix || "";
  const suffix = gMeta?.suffix || "";
  const upper = String(code || "").trim().toUpperCase();

  return {
    itemCode: code,
    stockName: gMeta?.name || yMeta.shortName || upper,
    closePrice: `${prefix}${fmt(price)}${suffix}`,
    compareToPreviousClosePrice: `${fmt(Math.abs(diff))}${suffix}`,
    fluctuationsRatio: ratio.toFixed(2),
    compareToPreviousPrice: { code: dirCode },
    stockExchangeName: gMeta?.market || yMeta.exchangeName || "US",
    marketStatus: yMeta.marketState === "REGULAR" ? "OPEN" : "CLOSE",
    newPcUrl: gMeta?.naverUrl || `https://finance.yahoo.com/quote/${encodeURIComponent(upper)}`,
  };
}

async function fetchRealtimeQuote(code) {
  const cleanCode = (code || "005930").trim();
  const upper = cleanCode.toUpperCase();

  if (isDomesticIndex(upper)) {
    const raw = await fetchJson(
      `https://polling.finance.naver.com/api/realtime/domestic/index/${encodeURIComponent(upper)}?_t=${Date.now()}`
    );
    const data = normalizeNaver(raw, cleanCode, true);
    if (!data) throw new Error("지수 응답 형식 오류");
    return data;
  }

  const gMeta = getGlobalMeta(upper);
  if (gMeta || !(/^[0-9A-Za-z]{6}$/.test(cleanCode) && /\d/.test(cleanCode))) {
    const yahooSym = gMeta?.yahoo || upper;
    const raw = await fetchJson(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=1d&range=1d&_t=${Date.now()}`
    );
    const data = normalizeYahoo(raw, cleanCode, gMeta);
    if (!data) throw new Error("해외 시세 응답 오류");
    return data;
  }

  const raw = await fetchJson(
    `https://m.stock.naver.com/api/stock/${encodeURIComponent(cleanCode)}/basic?_t=${Date.now()}`
  );
  const data = normalizeNaver(raw, cleanCode, false);
  if (!data) throw new Error("국내 주식 응답 오류");
  return data;
}

function buildTargetUrl(code, urlMode, apiNewPcUrl) {
  const cleanCode = (code || "005930").trim();
  const upper = cleanCode.toUpperCase();
  const gMeta = getGlobalMeta(upper);
  if (gMeta) return gMeta.naverUrl;

  if (isDomesticIndex(upper)) {
    if (urlMode === "naverPayMobile") return `https://m.stock.naver.com/domestic/index/${upper}/total`;
    if (urlMode === "naverFinance") return `https://finance.naver.com/sise/sise_index.naver?code=${upper}`;
    return `https://stock.naver.com/domestic/index/${upper}`;
  }

  if (/^[0-9A-Za-z]{6}$/.test(cleanCode) && /\d/.test(cleanCode)) {
    if (urlMode === "naverPayMobile") return `https://m.stock.naver.com/domestic/stock/${cleanCode}/total`;
    if (urlMode === "naverFinance") return `https://finance.naver.com/item/main.naver?code=${cleanCode}`;
    return apiNewPcUrl || `https://stock.naver.com/domestic/stock/${cleanCode}`;
  }

  return `https://finance.yahoo.com/quote/${encodeURIComponent(upper)}`;
}

// --- SVG Renderer (144x144) ---

function escapeXml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderStockSvgDataUrl(data, settings) {
  const dirCode = String(data?.compareToPreviousPrice?.code || "3");
  const isUp = dirCode === "1" || dirCode === "2";
  const isDown = dirCode === "4" || dirCode === "5";

  const accentColor = isUp ? "#FF4D4F" : isDown ? "#3B82F6" : "#9CA3AF";
  const pillBg = isUp
    ? "rgba(255,77,79,0.18)"
    : isDown
    ? "rgba(59,130,246,0.18)"
    : "rgba(156,163,175,0.18)";
  const arrow = isUp ? "▲" : isDown ? "▼" : "-";

  const exchange = escapeXml(data.stockExchangeName || "KRX");
  const isOpen = data.marketStatus === "OPEN";
  const dotColor = isOpen ? "#10B981" : "#64748B";

  const rawName = data.stockName || settings.stockName || data.itemCode || "";
  const nameLen = rawName.length;
  const nameFontSize = nameLen > 9 ? 14 : nameLen > 6 ? 17 : 20;
  const displayName = escapeXml(nameLen > 12 ? rawName.slice(0, 11) + "…" : rawName);

  const rawRatio = Number(data.fluctuationsRatio || 0);
  const sign = isUp ? "+" : isDown ? "-" : "";
  const ratioStr = Number.isNaN(rawRatio)
    ? `${data.fluctuationsRatio}%`
    : `${sign}${Math.abs(rawRatio).toFixed(2)}%`;

  const ratioFontSize = ratioStr.length > 8 ? 20 : 24;
  const diffText = escapeXml(`${arrow} ${data.compareToPreviousClosePrice || "0"}`);
  const priceText = escapeXml(data.closePrice || "-");
  const priceFontSize = priceText.length > 10 ? 15 : 18;

  const headerSvg =
    settings.showExchange !== false
      ? `<text x="12" y="22" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="12" font-weight="700" fill="#94A3B8">${exchange}</text>
         <circle cx="128" cy="18" r="4.5" fill="${dotColor}" />`
      : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#141B2D"/>
      <stop offset="100%" stop-color="#0B0F19"/>
    </linearGradient>
  </defs>
  <rect width="144" height="144" fill="url(#bg)"/>
  <rect width="144" height="4" fill="${accentColor}"/>
  ${headerSvg}
  <text x="72" y="45" text-anchor="middle" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="${nameFontSize}" font-weight="700" fill="#F8FAFC">${displayName}</text>
  <rect x="8" y="57" width="128" height="48" rx="8" fill="${pillBg}"/>
  <text x="72" y="80" text-anchor="middle" font-family="Malgun Gothic, Segoe UI, sans-serif" font-size="${ratioFontSize}" font-weight="700" fill="${accentColor}">${escapeXml(ratioStr)}</text>
  <text x="72" y="98" text-anchor="middle" font-family="Malgun Gothic, Segoe UI, sans-serif" font-size="12" font-weight="700" fill="${accentColor}">${diffText}</text>
  <text x="72" y="128" text-anchor="middle" font-family="Malgun Gothic, Segoe UI, sans-serif" font-size="${priceFontSize}" font-weight="700" fill="#E2E8F0">${priceText}</text>
</svg>`;

  return "data:image/svg+xml;base64," + Buffer.from(svg, "utf8").toString("base64");
}

function renderErrorSvgDataUrl(code, msg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
  <rect width="144" height="144" fill="#18181B"/>
  <rect width="144" height="4" fill="#EF4444"/>
  <text x="72" y="58" text-anchor="middle" font-family="Malgun Gothic, sans-serif" font-size="18" font-weight="700" fill="#FCA5A5">${escapeXml(code || "오류")}</text>
  <text x="72" y="92" text-anchor="middle" font-family="Malgun Gothic, sans-serif" font-size="13" fill="#A1A1AA">${escapeXml(msg || "조회 실패")}</text>
</svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg, "utf8").toString("base64");
}

// --- Plugin State & Ulanzi Protocol ---

const [argvAddress, argvPort] = process.argv.slice(2);
const ws = new SimpleWebSocket(argvAddress || "127.0.0.1", argvPort || 3906);
const contexts = new Map(); // context -> { uuid, key, actionid, settings, timer, inFlight, lastData }

function encodeContext(d) {
  return `${d.uuid}__${d.key}__${d.actionid}`;
}

function sendJson(obj) {
  ws.send(JSON.stringify(obj));
}

function setIcon(ctxObj, dataUrl) {
  sendJson({
    cmd: "state",
    param: {
      statelist: [
        {
          uuid: ctxObj.uuid,
          key: ctxObj.key,
          actionid: ctxObj.actionid,
          type: 1,
          data: dataUrl,
          textData: "",
          showtext: false,
        },
      ],
    },
  });
}

function sendParamFromPlugin(ctxObj, settings) {
  sendJson({
    cmd: "paramfromplugin",
    uuid: ctxObj.uuid,
    key: ctxObj.key,
    actionid: ctxObj.actionid,
    param: settings,
  });
}

function openExternalUrl(rawUrl) {
  const [baseUrl, query] = String(rawUrl).split("?");
  let param = null;
  if (query) {
    param = {};
    for (const part of query.split("&")) {
      const [k, v] = part.split("=");
      if (k) param[decodeURIComponent(k)] = decodeURIComponent(v || "");
    }
  }
  sendJson({
    cmd: "openurl",
    url: baseUrl,
    local: false,
    param,
  });
}

async function updateContext(context) {
  const state = contexts.get(context);
  if (!state || state.inFlight) return;
  state.inFlight = true;
  const code = state.settings.stockCode || DEFAULT_SETTINGS.stockCode;
  try {
    const data = await fetchRealtimeQuote(code);
    if (!contexts.has(context)) return;
    state.lastData = data;
    if (data.stockName && state.settings.stockName !== data.stockName) {
      state.settings.stockName = data.stockName;
      sendParamFromPlugin(state, state.settings);
    }
    setIcon(state, renderStockSvgDataUrl(data, state.settings));
  } catch (err) {
    if (contexts.has(context)) {
      setIcon(state, renderErrorSvgDataUrl(code, "시세 조회 실패"));
    }
  } finally {
    if (contexts.has(context)) state.inFlight = false;
  }
}

function resetTimer(context) {
  const state = contexts.get(context);
  if (!state) return;
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  const sec = Number(state.settings.refreshInterval);
  if (sec > 0) {
    state.timer = setInterval(() => updateContext(context), sec * 1000);
  }
}

function ensureContext(data, settingsOverride) {
  const context = encodeContext(data);
  const existing = contexts.get(context);
  const settings = Object.assign(
    {},
    DEFAULT_SETTINGS,
    existing?.settings || {},
    settingsOverride || data.param || {}
  );
  if (existing) {
    existing.settings = settings;
    return { context, state: existing };
  }
  const state = {
    uuid: data.uuid,
    key: data.key,
    actionid: data.actionid,
    settings,
    timer: null,
    inFlight: false,
    lastData: null,
  };
  contexts.set(context, state);
  return { context, state };
}

ws.onopen = () => {
  sendJson({ code: 0, cmd: "connected", uuid: PLUGIN_UUID });
};

ws.onmessage = (evt) => {
  let data;
  try {
    data = JSON.parse(evt.data);
  } catch {
    return;
  }
  if (!data || (typeof data.code !== "undefined" && data.cmdType !== "REQUEST")) {
    return;
  }

  // Acknowledge host request
  sendJson({ code: 0, ...data });

  switch (data.cmd) {
    case "add": {
      const { context, state } = ensureContext(data);
      if (!data.param?.stockCode) {
        sendParamFromPlugin(state, state.settings);
      }
      updateContext(context);
      resetTimer(context);
      break;
    }
    case "paramfromapp":
    case "paramfromplugin": {
      if (data.param?.__cmd === "refreshNow") {
        const context = encodeContext(data);
        updateContext(context);
        break;
      }
      const { context } = ensureContext(data);
      updateContext(context);
      resetTimer(context);
      break;
    }
    case "run": {
      const { context, state } = ensureContext(data);
      const url = buildTargetUrl(
        state.settings.stockCode,
        state.settings.urlMode,
        state.lastData?.newPcUrl
      );
      openExternalUrl(url);
      updateContext(context);
      break;
    }
    case "clear": {
      if (Array.isArray(data.param)) {
        for (const item of data.param) {
          const context = encodeContext(item);
          const state = contexts.get(context);
          if (state?.timer) clearInterval(state.timer);
          contexts.delete(context);
        }
      }
      break;
    }
    default:
      break;
  }
};

ws.onclose = () => {
  for (const state of contexts.values()) {
    if (state.timer) clearInterval(state.timer);
  }
  contexts.clear();
};
