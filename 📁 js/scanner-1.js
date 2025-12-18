
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
        this.scanInterval = null;
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
        
        // Initialize
        this.bindEvents();
    }
    
    bindEvents() {
        // Bind UI events
        document.addEventListener('DOMContentLoaded', () => {
            // Update counters
            this.updateCounters();
            
            // Load saved settings
            this.loadSettings();
        });
    }
    
    /**
     * Your Python detect_v_pattern function converted to JavaScript
     * @param {Array} volumes - Array of volume values
     * @returns {boolean} - True if V pattern detected
     */
    detectVPattern(volumes) {
        if (!volumes || volumes.length < 5) return false;
        
        const last5 = volumes.slice(-5);
        
        // Convert to numbers
        const v = last5.map(x => Number(x));
        
        // Your Python conditions:
        // 1. Candle 3 is the lowest
        // 2. Candle 4 > Candle 3
        // 3. Candle 5 > Candle 4
        // 4. Candle 3 < Candle 1
        // 5. Candle 3 < Candle 2
        
        const conditions = [
            v[2] === Math.min(...v),           // Candle 3 is lowest
            v[3] > v[2],                       // Candle 4 > Candle 3
            v[4] > v[3],                       // Candle 5 > Candle 4
            v[2] < v[0],                       // Candle 3 < Candle 1
            v[2] < v[1]                        // Candle 3 < Candle 2
        ];
        
        return conditions.every(cond => cond);
    }
    
    /**
     * Your Python detect_u_pattern function converted to JavaScript
     * @param {Array} volumes - Array of volume values
     * @returns {boolean} - True if U pattern detected
     */
    detectUPattern(volumes) {
        if (!volumes || volumes.length < 6) return false;
        
        const last6 = volumes.slice(-6);
        const v = last6.map(x => Number(x));
        
        // Your Python conditions:
        // 1. Candle 3 < Candle 2
        // 2. Candle 4 < Candle 3
        // 3. Candle 5 > Candle 4
        // 4. Candle 6 > Candle 5
        // 5. Lowest < First
        // 6. Lowest < Second
        
        const conditions = [
            v[2] < v[1],                       // Candle 3 < Candle 2
            v[3] < v[2],                       // Candle 4 < Candle 3
            v[4] > v[3],                       // Candle 5 > Candle 4
            v[5] > v[4],                       // Candle 6 > Candle 5
            v[3] < v[0],                       // Lowest < First
            v[3] < v[1]                        // Lowest < Second
        ];
        
        return conditions.every(cond => cond);
    }
    
    /**
     * Detect D pattern (Volume spike followed by decline)
     * @param {Array} volumes - Array of volume values
     * @returns {boolean} - True if D pattern detected
     */
    detectDPattern(volumes) {
        if (!volumes || volumes.length < 5) return false;
        
        const last5 = volumes.slice(-5);
        const v = last5.map(x => Number(x));
        
        const conditions = [
            v[2] === Math.max(...v),           // Candle 3 is highest
            v[3] < v[2],                       // Candle 4 < Candle 3
            v[4] < v[3],                       // Candle 5 < Candle 4
            v[2] > v[0] * 1.5,                 // Spike at least 50% higher than Candle 1
            v[2] > v[1] * 1.5                  // Spike at least 50% higher than Candle 2
        ];
        
        return conditions.every(cond => cond);
    }
    
    /**
     * Fetch stock data from Yahoo Finance
     * @param {string} symbol - Stock symbol (e.g., 'RELIANCE.NS')
     * @returns {Object} - Stock data including volumes and prices
     */
    async fetchStockData(symbol) {
        try {
            const timePeriod = document.getElementById('timePeriod').value;
            
            // Yahoo Finance API URL
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${timePeriod}&interval=1d`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.chart.result?.[0]) {
                console.warn(`No data for ${symbol}`);
                return null;
            }
            
            const result = data.chart.result[0];
            const quote = result.indicators.quote[0];
            
            // Extract volumes and prices
            const volumes = quote.volume || [];
            const closes = quote.close || [];
            const opens = quote.open || [];
            const highs = quote.high || [];
            const lows = quote.low || [];
            
            if (volumes.length < 10) {
                console.warn(`Insufficient data for ${symbol}`);
                return null;
            }
            
            // Calculate additional metrics
            const currentPrice = closes[closes.length - 1] || 0;
            const previousPrice = closes[closes.length - 2] || currentPrice;
            const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
            
            const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
            const volumeRatio = volumes[volumes.length - 1] / avgVolume;
            
            return {
                symbol: symbol,
                volumes: volumes,
                currentPrice: currentPrice,
                previousPrice: previousPrice,
                priceChange: priceChange,
                open: opens[opens.length - 1] || 0,
                high: highs[highs.length - 1] || 0,
                low: lows[lows.length - 1] || 0,
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
        if (this.isScanning) return;
        
        this.isScanning = true;
        this.scanResults = [];
        this.scanStartTime = Date.now();
        this.currentStockIndex = 0;
        
        // Get selected stocks
        const stockList = document.getElementById('stockSelect').value;
        const stocks = this.stockLists[stockList] || this.stockLists.top10;
        
        // Get pattern settings
        const detectV = document.getElementById('vPattern').checked;
        const detectU = document.getElementById('uPattern').checked;
        const detectD = document.getElementById('dPattern').checked;
        
        if (!detectV && !detectU && !detectD) {
            alert('Please select at least one pattern type to detect.');
            this.isScanning = false;
            return;
        }
        
        // Update UI
        this.showProgressSection();
        this.updateStatus('Starting volume pattern scan...');
        
        // Reset counters
        document.getElementById('patternsFound').textContent = '0';
        document.getElementById('stocksScanned').textContent = '0';
        
        // Start scan
        for (let i = 0; i < stocks.length; i++) {
            if (!this.isScanning) break;
            
            this.currentStockIndex = i;
            const symbol = stocks[i];
            const stockName = symbol.replace('.NS', '');
            
            // Update progress
            const progress = ((i + 1) / stocks.length) * 100;
            this.updateProgress(progress, stockName);
            
            // Update elapsed time
            this.updateElapsedTime();
            
            // Fetch data
            const stockData = await this.fetchStockData(symbol);
            
            if (stockData) {
                let patterns = [];
                
                // Detect patterns
                if (detectV && this.detectVPattern(stockData.volumes)) {
                    patterns.push('V');
                }
                
                if (detectU && this.detectUPattern(stockData.volumes)) {
                    patterns.push('U');
                }
                
                if (detectD && this.detectDPattern(stockData.volumes)) {
                    patterns.push('D');
                }
                
                if (patterns.length > 0) {
                    // Add to results
                    this.addScanResult({
                        symbol: stockName,
                        patterns: patterns,
                        price: stockData.currentPrice,
                        change: stockData.priceChange,
                        volume: stockData.volume,
                        avgVolume: stockData.avgVolume,
                        volumeRatio: stockData.volumeRatio,
                        timestamp: stockData.timestamp,
                        data: stockData
                    });
                    
                    // Update counters
                    document.getElementById('patternsFound').textContent = this.scanResults.length;
                }
            }
            
            // Update scanned count
            document.getElementById('stocksScanned').textContent = i + 1;
            
            // Small delay to avoid rate limiting
            await this.delay(500);
        }
        
        // Scan complete
        this.completeScan();
    }
    
    /**
     * Add a result to scan results
     * @param {Object} result - Scan result object
     */
    addScanResult(result) {
        this.scanResults.push(result);
        
        // Update UI immediately
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
            tableBody.innerHTML = '';
            noResultsDiv.classList.remove('hidden');
            resultsSummary.textContent = 'No volume patterns detected in the scanned stocks.';
            resultCount.textContent = '(0)';
            return;
        }
        
        // Hide no results message
        noResultsDiv.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        
        // Update counts
        resultCount.textContent = `(${this.scanResults.length})`;
        
        // Update summary
        const vCount = this.scanResults.filter(r => r.patterns.includes('V')).length;
        const uCount = this.scanResults.filter(r => r.patterns.includes('U')).length;
        const dCount = this.scanResults.filter(r => r.patterns.includes('D')).length;
        
        resultsSummary.textContent = 
            `Found ${this.scanResults.length} stocks with volume patterns: ` +
            `${vCount} V-pattern${vCount !== 1 ? 's' : ''}, ` +
            `${uCount} U-pattern${uCount !== 1 ? 's' : ''}, ` +
            `${dCount} D-pattern${dCount !== 1 ? 's' : ''}`;
        
        // Build table rows
        let html = '';
        
        this.scanResults.forEach((result, index) => {
            const changeClass = result.change >= 0 ? 'text-green-600' : 'text-red-600';
            const changeIcon = result.change >= 0 ? '↗' : '↘';
            
            // Determine signal strength
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
            
            // Format patterns
            let patternsHtml = '';
            if (result.patterns.includes('V')) {
                patternsHtml += '<span class="pattern-badge v mr-1">V</span>';
            }
            if (result.patterns.includes('U')) {
                patternsHtml += '<span class="pattern-badge u mr-1">U</span>';
            }
            if (result.patterns.includes('D')) {
                patternsHtml += '<span class="pattern-badge d">D</span>';
            }
            
            html += `
                <tr class="fade-in ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="font-bold text-gray-900">${result.symbol}</div>
                        <div class="text-sm text-gray-500">NSE</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${patternsHtml}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap font-bold">
                        ₹${result.price.toFixed(2)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap ${changeClass} font-medium">
                        ${changeIcon} ${Math.abs(result.change).toFixed(2)}%
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-gray-900">${this.formatVolume(result.volume)}</div>
                        <div class="text-xs text-gray-500">${result.volumeRatio.toFixed(1)}x avg</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-3 py-1 rounded-full text-xs font-bold ${signalClass}">
                            ${signal}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onclick="scanner.viewChart('${result.symbol}')" 
                                class="text-primary hover:text-blue-700 mr-3">
                            <i class="fas fa-chart-line"></i>
                        </button>
                        <button onclick="scanner.viewDetails('${result.symbol}')" 
                                class="text-gray-600 hover:text-gray-800">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        
        // Show export and clear buttons
        document.getElementById('exportBtn').classList.remove('hidden');
        document.getElementById('clearBtn').classList.remove('hidden');
    }
    
    /**
     * Complete the scan
     */
    completeScan() {
        this.isScanning = false;
        this.updateStatus('Scan complete!');
        
        // Hide progress section
        document.getElementById('progressSection').classList.add('hidden');
        document.getElementById('stopBtn').classList.add('hidden');
        
        // Update scan stats
        const scanTime = ((Date.now() - this.scanStartTime) / 1000).toFixed(1);
        document.getElementById('scanStats').textContent = 
            `Scanned ${this.currentStockIndex + 1} stocks in ${scanTime} seconds`;
        
        // Update last updated time
        this.updateLastUpdated();
        
        // Show notification
        this.showNotification('Scan completed successfully!', 'success');
    }
    
    /**
     * Stop the current scan
     */
    stopScan() {
        this.isScanning = false;
        this.updateStatus('Scan stopped by user');
        
        // Hide progress section
        document.getElementById('progressSection').classList.add('hidden');
        document.getElementById('stopBtn').classList.add('hidden');
        
        // Show results if any
        if (this.scanResults.length > 0) {
            this.updateResultsTable();
        }
        
        this.showNotification('Scan stopped', 'warning');
    }
    
    /**
     * Export results to CSV
     */
    exportResults() {
        if (this.scanResults.length === 0) {
            alert('No results to export.');
            return;
        }
        
        // Create CSV content
        let csv = 'Symbol,Patterns,Price,Change%,Volume,Volume Ratio,Signal,Time\n';
        
        this.scanResults.forEach(result => {
            const row = [
                result.symbol,
                result.patterns.join(','),
                result.price.toFixed(2),
                result.change.toFixed(2),
                result.volume.toLocaleString(),
                result.volumeRatio.toFixed(2),
                result.patterns.includes('V') && result.change > 0 ? 'Strong Buy' : 
                result.patterns.includes('D') && result.change < 0 ? 'Strong Sell' : 'Neutral',
                new Date(result.timestamp).toLocaleString()
            ].map(field => `"${field}"`).join(',');
            
            csv += row + '\n';
        });
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `volume-patterns-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showNotification('Results exported successfully!', 'success');
    }
    
    /**
     * Clear all results
     */
    clearResults() {
        if (confirm('Are you sure you want to clear all results?')) {
            this.scanResults = [];
            document.getElementById('resultsTable').innerHTML = '';
            document.getElementById('noResults').classList.remove('hidden');
            document.getElementById('patternsFound').textContent = '0';
            document.getElementById('exportBtn').classList.add('hidden');
            document.getElementById('clearBtn').classList.add('hidden');
            this.showNotification('Results cleared', 'info');
        }
    }
    
    /**
     * View stock chart
     */
    viewChart(symbol) {
        window.open(`https://finance.yahoo.com/chart/${symbol}`, '_blank');
    }
    
    /**
     * View stock details
     */
    viewDetails(symbol) {
        alert(`Details for ${symbol}\n\n` +
              `Patterns detected: ${this.scanResults.find(r => r.symbol === symbol)?.patterns.join(', ')}\n` +
              `Click "View Chart" for more analysis.`);
    }
    
    /**
     * Show sample data for demonstration
     */
    showSampleData() {
        if (this.isScanning) {
            alert('Please stop the current scan first.');
            return;
        }
        
        // Sample data for demonstration
        this.scanResults = [
            {
                symbol: 'RELIANCE',
                patterns: ['V', 'U'],
                price: 2456.75,
                change: 1.25,
                volume: 5123456,
                avgVolume: 4500000,
                volumeRatio: 1.14,
                timestamp: new Date().toISOString()
            },
            {
                symbol: 'TCS',
                patterns: ['V'],
                price: 3456.50,
                change: 2.15,
                volume: 3123456,
                avgVolume: 2800000,
                volumeRatio: 1.12,
                timestamp: new Date().toISOString()
            },
            {
                symbol: 'HDFCBANK',
                patterns: ['D'],
                price: 1654.30,
                change: -0.75,
                volume: 7123456,
                avgVolume: 6500000,
                volumeRatio: 1.10,
                timestamp: new Date().toISOString()
            },
            {
                symbol: 'INFY',
                patterns: ['U'],
                price: 1543.25,
                change: 0.45,
                volume: 4123456,
                avgVolume: 3800000,
                volumeRatio: 1.09,
                timestamp: new Date().toISOString()
            }
        ];
        
        this.updateResultsTable();
        document.getElementById('resultsSection').classList.remove('hidden');
        
        this.showNotification('Sample data loaded for demonstration', 'info');
    }
    
    /**
     * Helper function to format volume
     */
    formatVolume(volume) {
        if (volume >= 10000000) {
            return (volume / 10000000).toFixed(2) + ' Cr';
        } else if (volume >= 100000) {
            return (volume / 100000).toFixed(2) + ' L';
        } else {
            return volume.toLocaleString();
        }
    }
    
    /**
     * Update progress bar and status
     */
    updateProgress(percent, stockName) {
        const progressBar = document.getElementById('progressBar');
        const progressPercent = document.getElementById('progressPercent');
        const scanningStock = document.getElementById('scanningStock');
        
        progressBar.style.width = `${percent}%`;
        progressPercent.textContent = `${Math.round(percent)}%`;
        scanningStock.textContent = `Scanning: ${stockName}`;
    }
    
    /**
     * Update status text
     */
    updateStatus(status) {
        document.getElementById('statusText').textContent = status;
    }
    
    /**
     * Update elapsed time
     */
    updateElapsedTime() {
        if (!this.scanStartTime) return;
        
        const elapsed = Math.floor((Date.now() - this.scanStartTime) / 1000);
        document.getElementById('elapsedTime').textContent = `${elapsed}s`;
        
        // Estimate ETA
        const progress = (this.currentStockIndex + 1) / this.stockLists.top10.length;
        if (progress > 0) {
            const totalTime = elapsed / progress;
            const eta = Math.max(0, totalTime - elapsed);
            document.getElementById('etaTime').textContent = `${Math.round(eta)}s`;
        }
    }
    
    /**
     * Show progress section
     */
    showProgressSection() {
        const progressSection = document.getElementById('progressSection');
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        progressSection.classList.remove('hidden');
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
    }
    
    /**
     * Update last updated time
     */
    updateLastUpdated() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: true 
        });
        document.getElementById('lastUpdated').textContent = timeString;
    }
    
    /**
     * Update counters
     */
    updateCounters() {
        // Update patterns found count
        const patternCount = this.scanResults.length;
        document.getElementById('patternsFound').textContent = patternCount;
        
        // Update last updated time
        this.updateLastUpdated();
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
            type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${
                    type === 'success' ? 'check-circle' :
                    type === 'warning' ? 'exclamation-triangle' :
                    type === 'error' ? 'times-circle' : 'info-circle'
                } mr-3"></i>
                <div class="flex-1">${message}</div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    /**
     * Load saved settings
     */
    loadSettings() {
        const savedSettings = localStorage.getItem('volumeScannerSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            document.getElementById('stockSelect').value = settings.stockSelect || 'top10';
            document.getElementById('vPattern').checked = settings.vPattern !== false;
            document.getElementById('uPattern').checked = settings.uPattern !== false;
            document.getElementById('dPattern').checked = settings.dPattern || false;
            document.getElementById('timePeriod').value = settings.timePeriod || '1mo';
        }
    }
    
    /**
     * Save current settings
     */
    saveSettings() {
        const settings = {
            stockSelect: document.getElementById('stockSelect').value,
            vPattern: document.getElementById('vPattern').checked,
            uPattern: document.getElementById('uPattern').checked,
            dPattern: document.getElementById('dPattern').checked,
            timePeriod: document.getElementById('timePeriod').value,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('volumeScannerSettings', JSON.stringify(settings));
    }
    
    /**
     * Utility function for delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create global scanner instance
const scanner = new VolumePatternScanner();

// Expose functions to global scope
window.startVolumeScan = () => scanner.startVolumeScan();
window.stopScan = () => scanner.stopScan();
window.exportResults = () => scanner.exportResults();
window.clearResults = () => scanner.clearResults();
window.showSampleData = () => scanner.showSampleData();

// Save settings when page unloads
window.addEventListener('beforeunload', () => {
    scanner.saveSettings();
});

// Export scanner instance for debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = scanner;
}
