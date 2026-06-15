import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface PriceSensitivityChartProps {
  chartData: Array<{
    name: string | number;
    'Z-Spread': string | number; 
    'Gross Price': number;
    'Net Price': number;
  }> | undefined; 
}

export const PriceSensitivityChart: React.FC<PriceSensitivityChartProps> = ({ chartData }) => {
  
 
  const safeData = chartData || [];

  
  const processedData = safeData.map(item => {
    let zSpreadValue = 0;
    if (typeof item['Z-Spread'] === 'string') {
      zSpreadValue = parseFloat(item['Z-Spread'].replace('%', ''));
    } else {
      zSpreadValue = item['Z-Spread'] || 0;
    }

    return {
      ...item,
      name: String(item.name),
      'Z-Spread': zSpreadValue, 
      'Gross Price': Number(item['Gross Price'] || 0),
      'Net Price': Number(item['Net Price'] || 0),
    };
  });

  const maxDataValue = processedData.length > 0 
    ? Math.max(...processedData.map(d => Math.max(d['Gross Price'], d['Net Price'])))
    : 35000000;

  const dynamicMax = maxDataValue > 0 ? Math.ceil(maxDataValue / 5000000) * 5000000 : 35000000;

  const generateDynamicTicks = (maxVal: number) => {
    const step = maxVal / 7;
    const ticksArray: number[] = [];
    for (let i = 0; i <= 7; i++) {
      ticksArray.push(Math.round(step * i));
    }
    return ticksArray;
  };

  const dynamicTicks = generateDynamicTicks(dynamicMax);

  const formatLeftYAxis = (value: number) => {
    return `${(value * 10).toFixed(2)}%`; 
  };

  if (processedData.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Loading Chart Data...</div>;
  }

  return (
    <div style={{ width: '100%', height: 480, fontFamily: 'Arial, sans-serif', padding: '20px', boxSizing: 'border-box' }}>
      <h3 style={{ 
        textAlign: 'center', 
        fontWeight: 'normal', 
        color: '#333', 
        marginBottom: '25px', 
        fontSize: '18px',
        background: 'none',      
        border: 'none',          
        padding: 0,              
        margin: '0 auto 25px auto', 
        width: '100%',
        display: 'block'
      }}>
        Entry Price Sensitivity to Z Spread
      </h3>

      <ResponsiveContainer width="100%" height="85%">
        <LineChart
          data={processedData} 
          margin={{ top: 10, right: 30, left: 60, bottom: 15 }}
        >
          <CartesianGrid vertical={false} stroke="#efefef" />
          
          <XAxis 
            dataKey="name" 
            tickLine={false} 
            axisLine={false}
            dy={10}
            stroke="#666"
            padding={{ left: 40, right: 40 }}
          />
          
          <YAxis 
            yAxisId="left"
            domain={[0, dynamicMax]} 
            ticks={dynamicTicks}
            tickFormatter={formatLeftYAxis}
            tickLine={false}
            axisLine={false}
            width={130}
            stroke="#666"
          />

          <YAxis 
            yAxisId="right"
            orientation="right"
            domain={[0, dynamicMax * 3]} 
            hide={true}
          />
          
          <Tooltip formatter={(value: any) => value ? value.toLocaleString() : ''} />
          
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            content={() => {
              const legendItems = [
                { label: 'Z-Spread', color: '#1d5491' },
                { label: 'Gross Price', color: '#e06626' },
                { label: 'Net Price', color: '#116e25' }
              ];
              return (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '14px', marginTop: '15px' }}>
                  {legendItems.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', width: '16px', height: '3px', backgroundColor: item.color }} />
                      <span style={{ color: '#555' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />

          <Line yAxisId="right" type="linear" dataKey="Z-Spread" stroke="#1d5491" strokeWidth={3} dot={false} />
          <Line yAxisId="left" type="linear" dataKey="Gross Price" stroke="#e06626" strokeWidth={3} dot={false} />
          <Line yAxisId="left" type="linear" dataKey="Net Price" stroke="#116e25" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceSensitivityChart;
