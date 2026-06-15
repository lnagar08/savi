import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface AmortRow {
  period: number;
  date: string;
  openingBalance: number;
  payment: number;
  interest: number;
  principal: number;
  closingBalance: number;
}

interface AmortisationChartProps {
  data: AmortRow[];
}

export const AmortisationChart: React.FC<AmortisationChartProps> = ({ data }) => {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { signDisplay: 'auto' }).format(value);
  };

  return (
   
    <div style={{ width: '100%', minWidth: '1000px', height: 420, backgroundColor: '#ffffff', padding: '20px' }}>
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
        Amortisation Profile
      </h3>
      
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data} margin={{ top: 10, right: 40, left: 50, bottom: 70 }}>
          <CartesianGrid vertical={false} stroke="#e0e0e0" />
        
            <XAxis 
            dataKey="date"
            type="category" 
            
            interval={0} 
            
            tickFormatter={(tick, index) => {
            
                if (index === 0 || index === data.length - 1) {
                return tick;
                }
            
                if (tick.includes('-11-')) {
                return tick;
                }
                
                return ''; 
            }}
            
            tick={{ 
                angle: -90, 
                textAnchor: 'end', 
                fontSize: 9, 
                fontFamily: 'sans-serif', 
                fill: '#595959' 
            }}
            height={95} 
            stroke="#b3b3b3"
            />

          
          <YAxis 
            tickFormatter={formatCurrency}
            tick={{ fontSize: 11, fontFamily: 'sans-serif', fill: '#595959' }}
            domain={['auto', 'auto']}
            stroke="#b3b3b3"
          />

          <Tooltip 
            formatter={(value: any) => [formatCurrency(Number(value || 0)), 'Closing Balance']}
            labelStyle={{ color: '#595959', fontFamily: 'sans-serif' }}
            contentStyle={{ fontFamily: 'sans-serif' }}
          />
          
          <Line 
            type="monotone" 
            dataKey="closingBalance"
            stroke="#005a8d" 
            strokeWidth={2.5} 
            dot={false} 
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
