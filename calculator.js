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

  // Get fee rates from inputs (converting percentage to decimal)
  const takerFeeRate = parseFloat(document.getElementById('takerFee').value) / 100;
  const makerFeeRate = parseFloat(document.getElementById('makerFee').value) / 100;

  // Validate required inputs
  if (!entryPrice || !position || !leverage || !availableMargin) {
    alert('请填写必要欄位');
    return;
  }

  // Format position to 2 decimal places
  const formattedPosition = Number(position.toFixed(2));

  // Calculate initial margin
  const imr = 1 / leverage; // Initial Margin Rate
  const initialMargin = Number((formattedPosition * imr).toFixed(2));
  document.getElementById('initialMargin').textContent = initialMargin.toFixed(2);

  // Calculate fees based on order type
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
    warningElement.textContent = '⚠️ 警告：强平价格高于止损价格，建议调整杠杆或仓位以降低风险';
    warningElement.classList.add('show');
  } else if (tradeType === 'short' && !isNaN(stopLoss) && liquidationPrice < stopLoss) {
    warningElement.textContent = '⚠️ 警告：强平价格低于止损价格，建议调整杠杆或仓位以降低风险';
    warningElement.classList.add('show');
  } else {
    warningElement.textContent = '';
    warningElement.classList.remove('show');
  }

  // Calculate take profit amounts and fees
  let takeProfitAmount = 0;
  if (!isNaN(takeProfit)) {
    // Apply same fee rate for take profit
    const takeProfitFee = Number((formattedPosition * feeRate).toFixed(2));
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
    // Apply same fee rate for stop loss
    const stopLossFee = Number((formattedPosition * feeRate).toFixed(2));
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

// Add input validation for fee inputs
document.getElementById('makerFee').addEventListener('input', function(e) {
  let value = parseFloat(e.target.value);
  if (value < 0) value = 0;
  if (value > 1) value = 1;
  e.target.value = value.toFixed(4);
});

document.getElementById('takerFee').addEventListener('input', function(e) {
  let value = parseFloat(e.target.value);
  if (value < 0) value = 0;
  if (value > 1) value = 1;
  e.target.value = value.toFixed(4);
});

function resetCalculator() {
  // Reset all input fields
  const inputs = document.querySelectorAll('input[type="number"]');
  inputs.forEach(input => {
    if (input.id === 'leverage') {
      input.value = 50; // Reset leverage to default value
    } else if (input.id === 'makerFee') {
      input.value = '0.0200'; // Reset maker fee to default
    } else if (input.id === 'takerFee') {
      input.value = '0.0500'; // Reset taker fee to default
    } else {
      input.value = ''; // Clear other number inputs
    }
  });

  // Reset select elements to first option
  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
    select.selectedIndex = 0;
  });

  // Reset all result displays
  const resultElements = [
    'initialMargin', 'entryFee', 'liquidationPrice', 'riskRewardRatio',
    'takeProfitAmount', 'takeProfitPercentage', 'takeProfitFee',
    'stopLossAmount', 'stopLossPercentage', 'stopLossFee'
  ];
  
  resultElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      if (id.includes('Percentage')) {
        element.textContent = '0.00%';
      } else {
        element.textContent = '0.00';
      }
      element.style.color = ''; // Reset color
    }
  });

  // Clear warning message
  const warningElement = document.getElementById('liquidationWarning');
  warningElement.textContent = '';
  warningElement.classList.remove('show');
}