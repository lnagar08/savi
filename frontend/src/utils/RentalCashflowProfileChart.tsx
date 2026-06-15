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

interface ProfileRow {
  period: number;
  date: string;            
  payment: number;   
}

interface RentalCashflowProfileChartProps {
  data: ProfileRow[];
}

export const RentalCashflowProfileChart: React.FC<RentalCashflowProfileChartProps> = ({ data }) => {
 
  const formatCurrency = (value: number) => {
    if (value === 0) return '-';
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div style={{ 
      width: '100%', 
      minWidth: '1100px', 
      height: 450, 
      backgroundColor: '#ffffff', 
      padding: '10px 20px',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
     
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
        Rental Cashflow Profile
      </h3>
      
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 50, bottom: 70 }}>
        
          <CartesianGrid vertical={false} stroke="#dcdcdc" strokeWidth={0.7} />
          
        
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
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#595959' }}
            domain={[0, 'auto']}
            dx={-5}
          />

          <Tooltip 
            formatter={(value: any) => [formatCurrency(Number(value || 0)), 'Cashflow']}
            labelStyle={{ color: '#595959' }}
          />
          
          
          <Line 
            type="stepAfter"       
            dataKey="payment" 
            stroke="#005a8d"        
            strokeWidth={3.5}       
            dot={false}             
            activeDot={{ r: 5 }}
            />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
