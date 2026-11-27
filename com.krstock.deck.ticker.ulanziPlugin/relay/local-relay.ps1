# Mirabox KR/Global Stock & Macro Local Realtime Relay Server (v1.3.0, Port 18765)
# Zero-dependency Windows PowerShell HTTP relay for Naver Finance & Yahoo Realtime APIs

$ErrorActionPreference = "SilentlyContinue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Add-Type -AssemblyName System.Net.Http

$port = 18765
$prefix = "http://127.0.0.1:$port/"

$handler = New-Object System.Net.Http.HttpClientHandler
$handler.AutomaticDecompression = [System.Net.DecompressionMethods]::GZip -bor [System.Net.DecompressionMethods]::Deflate
$client = New-Object System.Net.Http.HttpClient($handler)
$client.Timeout = [TimeSpan]::FromSeconds(5)
$client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")
$client.DefaultRequestHeaders.Add("Referer", "https://m.stock.naver.com/")

$etfCacheJson = $null
$etfCacheTime = [DateTime]::MinValue

$globalMap = @{
    # 해외 지수 선물
    "NQCV1"     = "NQ=F"
    "NQ=F"      = "NQ=F"
    "ESCV1"     = "ES=F"
    "ES=F"      = "ES=F"
    "YMCV1"     = "YM=F"
    "YM=F"      = "YM=F"
    "RTYCV1"    = "RTY=F"
    "RTY=F"     = "RTY=F"
    # 해외 지수
    ".IXIC"     = "^IXIC"
    ".NDX"      = "^NDX"
    ".INX"      = "^GSPC"
    ".DJI"      = "^DJI"
    ".SOX"      = "^SOX"
    # 환율 & 달러인덱스
    "FX_USDKRW" = "KRW=X"
    "USDKRW"    = "KRW=X"
    "KRW=X"     = "KRW=X"
    "DX-Y.NYB"  = "DX-Y.NYB"
    "DXY"       = "DX-Y.NYB"
    "USDX"      = "DX-Y.NYB"
    "JPY=X"     = "JPY=X"
    "USDJPY"    = "JPY=X"
    "EURUSD=X"  = "EURUSD=X"
    "EURUSD"    = "EURUSD=X"
    # 원자재 (WTI, 브렌트유, 천연가스, 금, 은, 구리)
    "CL=F"      = "CL=F"
    "CLCV1"     = "CL=F"
    "WTI"       = "CL=F"
    "BZ=F"      = "BZ=F"
    "LCOCV1"    = "BZ=F"
    "BRENT"     = "BZ=F"
    "NG=F"      = "NG=F"
    "NGCV1"     = "NG=F"
    "GC=F"      = "GC=F"
    "GCCV1"     = "GC=F"
    "GOLD"      = "GC=F"
    "SI=F"      = "SI=F"
    "SICV1"     = "SI=F"
    "SILVER"    = "SI=F"
    "HG=F"      = "HG=F"
    "HGCV1"     = "HG=F"
    "COPPER"    = "HG=F"
    # 채권 금리 / 변동성 / 크립토
    "^TNX"      = "^TNX"
    "US10Y"     = "^TNX"
    "TNX"       = "^TNX"
    "^TYX"      = "^TYX"
    "US30Y"     = "^TYX"
    "TYX"       = "^TYX"
    "^VIX"      = "^VIX"
    "VIX"       = "^VIX"
    "BTC-USD"   = "BTC-USD"
    "BTC"       = "BTC-USD"
}

function Fetch-UrlText {
    param(
        [string]$Url,
        [bool]$UseEucKr = $false
    )
    $resp = $client.GetAsync($Url).GetAwaiter().GetResult()
    if (-not $resp.IsSuccessStatusCode) {
        throw "HTTP $([int]$resp.StatusCode)"
    }
    $bytes = $resp.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
    if ($UseEucKr) {
        return [System.Text.Encoding]::GetEncoding(949).GetString($bytes)
    }
    return [System.Text.Encoding]::UTF8.GetString($bytes)
}

function Fetch-ValidNaverQuote {
    param([string[]]$Urls)
    $lastErr = "no data"
    foreach ($u in $Urls) {
        try {
            $body = Fetch-UrlText -Url $u
            if ($body -match '"closePrice"\s*:') {
                return $body
            }
            $lastErr = "missing closePrice"
        } catch {
            $lastErr = $_.Exception.Message
        }
    }
    throw $lastErr
}

function Fetch-YahooQuote {
    param([string]$Symbol)
    $enc = [Uri]::EscapeDataString($Symbol)
    $urls = @(
        "https://query1.finance.yahoo.com/v8/finance/chart/${enc}?range=1d&interval=1m",
        "https://query2.finance.yahoo.com/v8/finance/chart/${enc}?range=1d&interval=1m"
    )
    $lastErr = "no yahoo data"
    foreach ($u in $urls) {
        try {
            $body = Fetch-UrlText -Url $u
            if ($body -match '"regularMarketPrice"\s*:') {
                return $body
            }
            $lastErr = "missing regularMarketPrice"
        } catch {
            $lastErr = $_.Exception.Message
        }
    }
    throw $lastErr
}

function Send-JsonResponse {
    param(
        $Response,
        [int]$StatusCode,
        [string]$JsonBody
    )
    $Response.StatusCode = $StatusCode
    $Response.ContentType = "application/json; charset=utf-8"
    $Response.Headers.Add("Access-Control-Allow-Origin", "*")
    $Response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS")
    $Response.Headers.Add("Access-Control-Allow-Headers", "*")
    $Response.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate")
    $buf = [System.Text.Encoding]::UTF8.GetBytes($JsonBody)
    $Response.ContentLength64 = $buf.Length
    $Response.OutputStream.Write($buf, 0, $buf.Length)
    $Response.OutputStream.Close()
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
try {
    $listener.Start()
} catch {
    exit 1
}

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response

        if ($req.HttpMethod -eq "OPTIONS") {
            Send-JsonResponse -Response $res -StatusCode 200 -JsonBody "{}"
            continue
        }

        $path = $req.Url.AbsolutePath.ToLowerInvariant()

        if ($path -eq "/health") {
            Send-JsonResponse -Response $res -StatusCode 200 -JsonBody '{"ok":true,"version":"1.3.0"}'
            continue
        }

        if ($path -eq "/quote") {
            $code = $req.QueryString["code"]
            if ([string]::IsNullOrWhiteSpace($code)) {
                Send-JsonResponse -Response $res -StatusCode 400 -JsonBody '{"error":"missing code"}'
                continue
            }
            $code = $code.Trim()
            $upper = $code.ToUpperInvariant()
            $ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

            try {
                # 1) 국내 지수
                if ($upper -eq "KOSPI" -or $upper -eq "KOSDAQ" -or $upper -eq "KPI200") {
                    $urls = @(
                        "https://m.stock.naver.com/api/index/$upper/basic?_t=$ts",
                        "https://polling.finance.naver.com/api/realtime/domestic/index/$upper?_t=$ts"
                    )
                    $body = Fetch-ValidNaverQuote -Urls $urls
                    Send-JsonResponse -Response $res -StatusCode 200 -JsonBody $body
                    continue
                }

                # 2) 매핑된 해외 선물/지수/환율/매크로 지표
                if ($globalMap.ContainsKey($upper)) {
                    $ySym = $globalMap[$upper]
                    $body = Fetch-YahooQuote -Symbol $ySym
                    Send-JsonResponse -Response $res -StatusCode 200 -JsonBody $body
                    continue
                }

                # 3) 국내 주식/ETF (6자리이며 숫자 포함)
                if ($code -match '^[0-9A-Za-z]{6}$' -and $code -match '\d') {
                    $enc = [Uri]::EscapeDataString($code)
                    $urls = @(
                        "https://m.stock.naver.com/api/stock/$enc/basic?_t=$ts",
                        "https://polling.finance.naver.com/api/realtime/domestic/stock/$enc?_t=$ts"
                    )
                    $body = Fetch-ValidNaverQuote -Urls $urls
                    Send-JsonResponse -Response $res -StatusCode 200 -JsonBody $body
                    continue
                }

                # 4) 그 외 미국 개별주식/ETF/선물 티커 (예: QQQM, SCHD, NVDA 등)
                $body = Fetch-YahooQuote -Symbol $upper
                Send-JsonResponse -Response $res -StatusCode 200 -JsonBody $body
            } catch {
                $msg = $_.Exception.Message -replace '"', '\"'
                Send-JsonResponse -Response $res -StatusCode 502 -JsonBody "{`"error`":`"$msg`"}"
            }
            continue
        }

        if ($path -eq "/search") {
            $q = $req.QueryString["q"]
            if ([string]::IsNullOrWhiteSpace($q)) {
                Send-JsonResponse -Response $res -StatusCode 200 -JsonBody '{"items":[]}'
                continue
            }
            try {
                $enc = [Uri]::EscapeDataString($q.Trim())
                $u = "https://m.stock.naver.com/front-api/search/autoComplete?query=$enc&target=stock,index"
                $body = Fetch-UrlText -Url $u
                Send-JsonResponse -Response $res -StatusCode 200 -JsonBody $body
            } catch {
                $msg = $_.Exception.Message -replace '"', '\"'
                Send-JsonResponse -Response $res -StatusCode 502 -JsonBody "{`"error`":`"$msg`"}"
            }
            continue
        }

        if ($path -eq "/etf") {
            $now = [DateTime]::UtcNow
            if ($null -ne $etfCacheJson -and ($now - $etfCacheTime).TotalMinutes -lt 10) {
                Send-JsonResponse -Response $res -StatusCode 200 -JsonBody $etfCacheJson
                continue
            }
            try {
                $u = "https://finance.naver.com/api/sise/etfItemList.nhn"
                $body = Fetch-UrlText -Url $u -UseEucKr $true
                $etfCacheJson = $body
                $etfCacheTime = $now
                Send-JsonResponse -Response $res -StatusCode 200 -JsonBody $body
            } catch {
                $msg = $_.Exception.Message -replace '"', '\"'
                Send-JsonResponse -Response $res -StatusCode 502 -JsonBody "{`"error`":`"$msg`"}"
            }
            continue
        }

        Send-JsonResponse -Response $res -StatusCode 404 -JsonBody '{"error":"not found"}'
    } catch {
        # keep listening
    }
}
