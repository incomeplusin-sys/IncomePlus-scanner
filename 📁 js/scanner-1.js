console.log("Scanner-1.js file is LOADED successfully!");

/**
 * IncomePlus Volume Pattern Scanner
 * JavaScript implementation of Python volume pattern detection
 * Works with Yahoo Finance API for real-time data
 */

class VolumePatternScanner {
    constructor() {
        this.isScanning = false;
        this.scanResults = [];
        this.scanStartTime = null;
        this.currentStockIndex = 0;
        
        // NSE Stock Symbols
        this.stockLists = {
            top10: [
                'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
                'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS', 'BAJFINANCE.NS'
            ],
            nifty50: [
                'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'INFY.NS',
                'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS',
                'BAJFINANCE.NS', 'LT.NS', 'AXISBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS',
                'SUNPHARMA.NS', 'TITAN.NS', 'WIPRO.NS', 'ONGC.NS', 'POWERGRID.NS',
                'NTPC.NS', 'ULTRACEMCO.NS', 'M&M.NS', 'TECHM.NS', 'ADANIPORTS.NS',
                'BAJAJFINSV.NS', 'JSWSTEEL.NS', 'INDUSINDBK.NS', 'HCLTECH.NS', 'TATAMOTORS.NS'
            ],
            niftybank: [
                'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS',
                'INDUSINDBK.NS', 'PNB.NS', 'BANKBARODA.NS', 'FEDERALBNK.NS', 'IDFCFIRSTB.NS'
            ]
        };
    }
    
    /**
     * Your Python detect_v_pattern function converted to JavaScript
     */
    detectVPattern(volumes) {
        if (!volumes || volumes.length < 5) return false;
        
        const last5 = volumes.slice(-5);
        const v = last5.map(x => Number(x));
        
        const conditions = [
            v[2] === Math.min(...v),
            v[3] > v[2],
            v[4] > v[3],
            v[2] < v[0],
            v[2] < v[1]
        ];
        
        return conditions.every(cond => cond);
    }
    
    /**
     * Your Python detect_u_pattern function converted to JavaScript
     */
    detectUPattern(volumes) {
        if (!volumes || volumes.length < 6) return false;
        
        const last6 = volumes.slice(-6);
        const v = last6.map(x => Number(x));
        
        const conditions = [
            v[2] < v[1],
            v[3] < v[2],
            v[4] > v[3],
            v[5] > v[4],
            v[3] < v[0],
            v[3] < v[1]
        ];
        
        return conditions.every(cond => cond);
    }
    
    /**
     * Detect D pattern (Volume spike followed by decline)
     */
    detectDPattern(volumes) {
        if (!volumes || volumes.length < 5) return false;
        
        const last5 = volumes.slice(-5);
        const v = last5.map(x => Number(x));
        
        const conditions = [
            v[2] === Math.max(...v),
            v[3] < v[2],
            v[4] < v[3],
            v[2] > v[0] * 1.5,
            v[2] > v[1] * 1.5
        ];
        
        return conditions.every(cond => cond);
    }
    
    /**
     * Fetch stock data from Yahoo Finance
     */
    async fetchStockData(symbol) {
        try {
            const timePeriod = document.getElementById('timePeriod')?.value || '1mo';
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${timePeriod}&interval=1d`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            if (!data.chart.result?.[0]) return null;
            
            const result = data.chart.result[0];
            const quote = result.indicators.quote[0];
            
            const volumes = quote.volume || [];
            const closes = quote.close || [];
            
            if (volumes.length < 10) return null;
            
            const currentPrice = closes[closes.length - 1] || 0;
            const previousPrice = closes[closes.length - 2] || currentPrice;
            const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
            const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
            const volumeRatio = volumes[volumes.length - 1] / avgVolume;
            
            return {
                symbol: symbol,
                volumes: volumes,
                currentPrice: currentPrice,
                priceChange: priceChange,
                volume: volumes[volumes.length - 1] || 0,
                avgVolume: avgVolume,
                volumeRatio: volumeRatio,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`Failed to fetch ${symbol}:`, error);
            return null;
        }
    }
    
    /**
     * Start the live volume scan
     */
    async startVolumeScan() {
        console.log('startVolumeScan function called');
        
        if (this.isScanning) {
            alert('Scan already in progress!');
            return;
        }
        
        this.isScanning = true;
        this.scanResults = [];
        this.scanStartTime = Date.now();
        
        const stockList = document.getElementById('stockSelect')?.value || 'top10';
        const stocks = this.stockLists[stockList] || this.stockLists.top10;
        
        const detectV = document.getElementById('vPattern')?.checked || true;
        const detectU = document.getElementById('uPattern')?.checked || true;
        const detectD = document.getElementById('dPattern')?.checked || false;
        
        if (!detectV && !detectU && !detectD) {
            alert('Please select at least one pattern type to detect.');
            this.isScanning = false;
            return;
        }
        
        // Update UI
        this.showProgressSection();
        this.updateStatus('Starting scan...');
        document.getElementById('patternsFound').textContent = '0';
        document.getElementById('stocksScanned').textContent = '0';
        
        console.log('Starting scan with', stocks.length, 'stocks');
        
        // Start scan
        for (let i = 0; i < stocks.length; i++) {
            if (!this.isScanning) break;
            
            this.currentStockIndex = i;
            const symbol = stocks[i];
            const stockName = symbol.replace('.NS', '');
            
            // Update progress
            const progress = ((i + 1) / stocks.length) * 100;
            this.updateProgress(progress, stockName);
            
            // Fetch data
            console.log(`Fetching ${symbol}...`);
            const stockData = await this.fetchStockData(symbol);
            
            if (stockData) {
                let patterns = [];
                
                if (detectV && this.detectVPattern(stockData.volumes)) patterns.push('V');
                if (detectU && this.detectUPattern(stockData.volumes)) patterns.push('U');
                if (detectD && this.detectDPattern(stockData.volumes)) patterns.push('D');
                
                if (patterns.length > 0) {
                    this.addScanResult({
                        symbol: stockName,
                        patterns: patterns,
                        price: stockData.currentPrice,
                        change: stockData.priceChange,
                        volume: stockData.volume,
                        volumeRatio: stockData.volumeRatio,
                        timestamp: stockData.timestamp
                    });
                    
                    document.getElementById('patternsFound').textContent = this.scanResults.length;
                }
            }
            
            document.getElementById('stocksScanned').textContent = i + 1;
            await this.delay(300); // Shorter delay for testing
        }
        
        this.completeScan();
    }
    
    /**
     * Add a result to scan results
     */
    addScanResult(result) {
        this.scanResults.push(result);
        this.updateResultsTable();
    }
    
    /**
     * Update the results table
     */
    updateResultsTable() {
        const tableBody = document.getElementById('resultsTable');
        const noResultsDiv = document.getElementById('noResults');
        const resultsSection = document.getElementById('resultsSection');
        const resultCount = document.getElementById('resultCount');
        const resultsSummary = document.getElementById('resultsSummary');
        
        if (this.scanResults.length === 0) {
            if (tableBody) tableBody.innerHTML = '';
            if (noResultsDiv) noResultsDiv.classList.remove('hidden');
            if (resultsSummary) resultsSummary.textContent = 'No volume patterns detected.';
            if (resultCount) resultCount.textContent = '(0)';
            return;
        }
        
        if (noResultsDiv) noResultsDiv.classList.add('hidden');
        if (resultsSection) resultsSection.classList.remove('hidden');
        
        if (resultCount) resultCount.textContent = `(${this.scanResults.length})`;
        
        const vCount = this.scanResults.filter(r => r.patterns.includes('V')).length;
        const uCount = this.scanResults.filter(r => r.patterns.includes('U')).length;
        const dCount = this.scanResults.filter(r => r.patterns.includes('D')).length;
        
        if (resultsSummary) {
            resultsSummary.textContent = 
                `Found ${this.scanResults.length} stocks with patterns: ` +
                `${vCount} V, ${uCount} U, ${dCount} D`;
        }
        
        let html = '';
        this.scanResults.forEach((result, index) => {
            const changeClass = result.change >= 0 ? 'text-green-600' : 'text-red-600';
            const changeIcon = result.change >= 0 ? '↗' : '↘';
            
            let signal = 'Neutral';
            let signalClass = 'bg-gray-100 text-gray-800';
            
            if (result.patterns.includes('V') && result.change > 0) {
                signal = 'Strong Buy';
                signalClass = 'bg-green-100 text-green-800';
            } else if (result.patterns.includes('D') && result.change < 0) {
                signal = 'Strong Sell';
                signalClass = 'bg-red-100 text-red-800';
            } else if (result.patterns.includes('U')) {
                signal = 'Accumulation';
                signalClass = 'bg-blue-100 text-blue-800';
            }
            
            let patternsHtml = '';
            if (result.patterns.includes('V')) patternsHtml += '<span class="pattern-badge v mr-1">V</span>';
            if (result.patterns.includes('U')) patternsHtml += '<span class="pattern-badge u mr-1">U</span>';
            if (result.patterns.includes('D')) patternsHtml += '<span class="pattern-badge d">D</span>';
            
            html += `
                <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                    <td class="px-4 py-3">
                        <div class="font-bold">${result.symbol}</div>
                        <div class="text-xs text-gray-500">NSE</div>
                    </td>
                    <td class="px-4 py-3">${patternsHtml}</td>
                    <td class="px-4 py-3 font-bold">₹${result.price.toFixed(2)}</td>
                    <td class="px-4 py-3 ${changeClass}">${changeIcon} ${Math.abs(result.change).toFixed(2)}%</td>
                    <td class="px-4 py-3">
                        <div>${this.formatVolume(result.volume)}</div>
                        <div class="text-xs">${result.volumeRatio.toFixed(1)}x avg</div>
                    </td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 rounded-full text-xs ${signalClass}">${signal}</span>
                    </td>
                    <td class="px-4 py-3">
                        <button onclick="scanner.viewChart('${result.symbol}')" class="text-blue-600 hover:text-blue-800 mr-2">
                            <i class="fas fa-chart-line"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        if (tableBody) tableBody.innerHTML = html;
        
        const exportBtn = document.getElementById('exportBtn');
        const clearBtn = document.getElementById('clearBtn');
        if (exportBtn) exportBtn.classList.remove('hidden');
        if (clearBtn) clearBtn.classList.remove('hidden');
    }
    
    /**
     * Complete the scan
     */
    completeScan() {
        this.isScanning = false;
        this.updateStatus('Scan complete!');
        
        const progressSection = document.getElementById('progressSection');
        const stopBtn = document.getElementById('stopBtn');
        if (progressSection) progressSection.classList.add('hidden');
        if (stopBtn) stopBtn.classList.add('hidden');
        
        console.log('Scan completed. Found', this.scanResults.length, 'patterns');
        alert(`Scan complete! Found ${this.scanResults.length} volume patterns.`);
    }
    
    /**
     * Stop the current scan
     */
    stopScan() {
        this.isScanning = false;
        this.updateStatus('Scan stopped');
        
        const progressSection = document.getElementById('progressSection');
        const stopBtn = document.getElementById('stopBtn');
        if (progressSection) progressSection.classList.add('hidden');
        if (stopBtn) stopBtn.classList.add('hidden');
        
        alert('Scan stopped by user');
    }
    
    /**
     * Export results to CSV
     */
    exportResults() {
        if (this.scanResults.length === 0) {
            alert('No results to export.');
            return;
        }
        
        let csv = 'Symbol,Patterns,Price,Change%,Volume,Volume Ratio,Time\n';
        this.scanResults.forEach(result => {
            csv += `"${result.symbol}","${result.patterns.join(',')}",${result.price.toFixed(2)},${result.change.toFixed(2)},${result.volume},${result.volumeRatio.toFixed(2)},"${new Date(result.timestamp).toLocaleString()}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `volume-patterns-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        alert('Results exported as CSV!');
    }
    
    /**
     * Clear all results
     */
    clearResults() {
        if (confirm('Clear all results?')) {
            this.scanResults = [];
            const tableBody = document.getElementById('resultsTable');
            if (tableBody) tableBody.innerHTML = '';
            
            const noResults = document.getElementById('noResults');
            if (noResults) noResults.classList.remove('hidden');
            
            document.getElementById('patternsFound').textContent = '0';
            
            const exportBtn = document.getElementById('exportBtn');
            const clearBtn = document.getElementById('clearBtn');
            if (exportBtn) exportBtn.classList.add('hidden');
            if (clearBtn) clearBtn.classList.add('hidden');
            
            alert('Results cleared');
        }
    }
    
    /**
     * View stock chart
     */
    viewChart(symbol) {
        window.open(`https://finance.yahoo.com/chart/${symbol}`, '_blank');
    }
    
    /**
     * Show sample data for demonstration
     */
    showSampleData() {
        if (this.isScanning) {
            alert('Please stop the current scan first.');
            return;
        }
        
        this.scanResults = [
            {
                symbol: 'RELIANCE',
                patterns: ['V'],
                price: 2456.75,
                change: 1.25,
                volume: 5123456,
                volumeRatio: 1.14,
                timestamp: new Date().toISOString()
            },
            {
                symbol: 'TCS',
                patterns: ['U'],
                price: 3456.50,
                change: 2.15,
                volume: 3123456,
                volumeRatio: 1.12,
                timestamp: new Date().toISOString()
            }
        ];
        
        this.updateResultsTable();
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) resultsSection.classList.remove('hidden');
        
        alert('Sample data loaded!');
    }
    
    /**
     * Helper function to format volume
     */
    formatVolume(volume) {
        if (volume >= 10000000) return (volume / 10000000).toFixed(2) + ' Cr';
        if (volume >= 100000) return (volume / 100000).toFixed(2) + ' L';
        return volume.toLocaleString();
    }
    
    /**
     * Update progress bar and status
     */
    updateProgress(percent, stockName) {
        const progressBar = document.getElementById('progressBar');
        const progressPercent = document.getElementById('progressPercent');
        const scanningStock = document.getElementById('scanningStock');
        
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${Math.round(percent)}%`;
        if (scanningStock) scanningStock.textContent = `Scanning: ${stockName}`;
    }
    
    /**
     * Update status text
     */
    updateStatus(status) {
        const statusText = document.getElementById('statusText');
        if (statusText) statusText.textContent = status;
    }
    
    /**
     * Show progress section
     */
    showProgressSection() {
        const progressSection = document.getElementById('progressSection');
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (progressSection) progressSection.classList.remove('hidden');
        if (startBtn) startBtn.classList.add('hidden');
        if (stopBtn) stopBtn.classList.remove('hidden');
    }
    
    /**
     * Utility function for delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============================================
// GLOBAL SETUP - WAIT FOR PAGE TO LOAD
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up scanner...');
    
    // Create global scanner instance
    window.scanner = new VolumePatternScanner();
    
    // Create global functions
    window.startVolumeScan = function() {
        console.log('startVolumeScan triggered via button');
        if (window.scanner) {
            return window.scanner.startVolumeScan();
        } else {
            alert('Scanner not ready! Please refresh page.');
            console.error('Scanner instance not found');
        }
    };
    
    window.stopScan = function() {
        if (window.scanner) return window.scanner.stopScan();
    };
    
    window.exportResults = function() {
        if (window.scanner) return window.scanner.exportResults();
    };
    
    window.clearResults = function() {
        if (window.scanner) return window.scanner.clearResults();
    };
    
    window.showSampleData = function() {
        if (window.scanner) return window.scanner.showSampleData();
    };
    
    console.log('✅ Scanner setup complete');
    console.log('✅ startVolumeScan is a function:', typeof startVolumeScan === 'function');
    
    // Test: Add click handler directly
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Start button clicked directly');
            if (window.scanner) {
                window.scanner.startVolumeScan();
            }
        });
    }
});
