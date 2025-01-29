function calculate() {
  // Get input values
  const entryPrice = parseFloat(document.getElementById('entryPrice').value);
  const position = parseFloat(document.getElementById('position').value);
  const leverage = parseFloat(document.getElementById('leverage').value);
  const availableMargin = parseFloat(document.getElementById('availableMargin').value);
  const tradeType = document.getElementById('tradeType').value;
  const marginMode = document.getElementById('marginMode').value;
  const orderType = document.getElementById('orderType').value;
  const takeProfit = parseFloat(document.getElementById('takeProfit').value);
  const stopLoss = parseFloat(document.getElementById('stopLoss').value);

  // Validate required inputs
  if (!entryPrice || !position || !leverage || !availableMargin) {
    alert('請填寫必要欄位');
    return;
  }

  // Format position to 2 decimal places
  const formattedPosition = Number(position.toFixed(2));

  // Calculate initial margin
  const imr = 1 / leverage; // Initial Margin Rate
  const initialMargin = Number((formattedPosition * imr).toFixed(2));
  document.getElementById('initialMargin').textContent = initialMargin.toFixed(2);

  // Calculate fees
  const takerFeeRate = 0.0005;
  const makerFeeRate = 0.0002;
  const feeRate = orderType === 'market' ? takerFeeRate : makerFeeRate;
  const entryFee = Number((formattedPosition * feeRate).toFixed(2));
  document.getElementById('entryFee').textContent = entryFee.toFixed(2);

  // Calculate liquidation price
  const mmr = 0.005; // Maintenance Margin Rate (0.5%)
  let liquidationPrice;
  
  if (tradeType === 'long') {
    liquidationPrice = entryPrice * (1 - (availableMargin / position - mmr) * leverage / (leverage - 1));
  } else {
    liquidationPrice = entryPrice * (1 + (availableMargin / position - mmr) * leverage / (leverage - 1));
  }
  
  document.getElementById('liquidationPrice').textContent = liquidationPrice.toFixed(4);

  // Update warning message validation
  const warningElement = document.getElementById('liquidationWarning');
  if (tradeType === 'long' && !isNaN(stopLoss) && liquidationPrice > stopLoss) {
    warningElement.textContent = '⚠️ 警告：強平價格高於止損價格，建議調整槓桿或倉位以降低風險';
    warningElement.classList.add('show');
  } else if (tradeType === 'short' && !isNaN(stopLoss) && liquidationPrice < stopLoss) {
    warningElement.textContent = '⚠️ 警告：強平價格低於止損價格，建議調整槓桿或倉位以降低風險';
    warningElement.classList.add('show');
  } else {
    warningElement.textContent = '';
    warningElement.classList.remove('show');
  }

  // Calculate take profit amounts and fees
  let takeProfitAmount = 0;
  if (!isNaN(takeProfit)) {
    const takeProfitFee = Number((formattedPosition * (takeProfit / entryPrice) * feeRate).toFixed(2));
    document.getElementById('takeProfitFee').textContent = takeProfitFee.toFixed(2);

    if (tradeType === 'long') {
      takeProfitAmount = formattedPosition * ((takeProfit - entryPrice) / entryPrice);
    } else {
      takeProfitAmount = formattedPosition * ((entryPrice - takeProfit) / entryPrice);
    }
    takeProfitAmount = Number((takeProfitAmount - entryFee - takeProfitFee).toFixed(2));
    document.getElementById('takeProfitAmount').textContent = takeProfitAmount.toFixed(2);
  }

  // Calculate stop loss amounts and fees
  let stopLossAmount = 0;
  if (!isNaN(stopLoss)) {
    const stopLossFee = Number((formattedPosition * (stopLoss / entryPrice) * feeRate).toFixed(2));
    document.getElementById('stopLossFee').textContent = stopLossFee.toFixed(2);

    if (tradeType === 'long') {
      stopLossAmount = formattedPosition * ((stopLoss - entryPrice) / entryPrice);
    } else {
      stopLossAmount = formattedPosition * ((entryPrice - stopLoss) / entryPrice);
    }
    stopLossAmount = Number((stopLossAmount - entryFee - stopLossFee).toFixed(2));
    document.getElementById('stopLossAmount').textContent = stopLossAmount.toFixed(2);
  }

  // Calculate risk-reward ratio
  if (!isNaN(takeProfit) && !isNaN(stopLoss) && stopLossAmount !== 0) {
    const riskRewardRatio = Math.abs(takeProfitAmount / stopLossAmount);
    document.getElementById('riskRewardRatio').textContent = riskRewardRatio.toFixed(2);
  }

  // Calculate percentage changes
  if (!isNaN(takeProfit)) {
    const takeProfitPercentage = ((takeProfit - entryPrice) / entryPrice * 100);
    document.getElementById('takeProfitPercentage').textContent = 
      `${takeProfitPercentage > 0 ? '+' : ''}${takeProfitPercentage.toFixed(2)}%`;
    updateResultColors('takeProfitPercentage', takeProfitPercentage);
  }

  if (!isNaN(stopLoss)) {
    const stopLossPercentage = ((stopLoss - entryPrice) / entryPrice * 100);
    document.getElementById('stopLossPercentage').textContent = 
      `${stopLossPercentage > 0 ? '+' : ''}${stopLossPercentage.toFixed(2)}%`;
    updateResultColors('stopLossPercentage', stopLossPercentage);
  }

  // Update colors
  updateResultColors('takeProfitAmount', parseFloat(document.getElementById('takeProfitAmount').textContent));
  updateResultColors('stopLossAmount', parseFloat(document.getElementById('stopLossAmount').textContent));
}

function updateResultColors(elementId, value) {
  const element = document.getElementById(elementId);
  if (value > 0) {
    element.style.color = '#00c853';
  } else if (value < 0) {
    element.style.color = '#ff1744';
  } else {
    element.style.color = '#1e88e5';
  }
}

// 輸入驗證：限制槓桿倍數在1-125之間，預設值50
document.getElementById('leverage').addEventListener('input', function(e) {
  const value = parseInt(e.target.value);
  if (value < 1) e.target.value = 1;
  if (value > 125) e.target.value = 125;
});

// 防止輸入負數，並設置小數點限制
const numberInputs = document.querySelectorAll('input[type="number"]');
numberInputs.forEach(input => {
  input.addEventListener('input', function(e) {
    if (e.target.value < 0) e.target.value = 0;
    
    // 價格相關輸入（開倉價、止盈價、止損價）限制小數點後4位
    if (['entryPrice', 'takeProfit', 'stopLoss'].includes(e.target.id)) {
      if (e.target.value.includes('.')) {
        const parts = e.target.value.split('.');
        if (parts[1].length > 4) {
          e.target.value = Number(e.target.value).toFixed(4);
        }
      }
    }
    
    // 倉位大小限制為整數
    if (e.target.id === 'position') {
      e.target.value = Math.floor(e.target.value);
    }
  });
});