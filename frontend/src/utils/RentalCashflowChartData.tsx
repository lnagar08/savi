import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface CashflowRow {
  period: number;
  date: string;         // Format: DD-MM-YYYY
  interest: number;     
  principal: number;    
}

interface RentalCashflowChartProps {
  data: CashflowRow[];
}

export const RentalCashflowChartData: React.FC<RentalCashflowChartProps> = ({ data }) => {

  const formatCurrency = (value: number) => {
    if (value === 0) return '-';
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div style={{ 
      width: '100%', 
      height: 480, 
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
        Rental Cashflow Split : Interest vs Principal
      </h3>
      
      <ResponsiveContainer width="100%" height="90%">
        <BarChart 
          data={data} 
          margin={{ top: 10, right: 20, left: 40, bottom: 60 }}
          barCategoryGap="10%" 
          barGap={0}
        >
         
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
            tick={{ fontSize: 11, fontFamily: 'sans-serif', fill: '#595959' }}
            domain={['auto', 'auto']}
            stroke="#b3b3b3"
          />
          <Tooltip 
            formatter={(value: any, name: any) => [formatCurrency(Number(value || 0)), String(name || '')]}
            labelStyle={{ color: '#595959' }}
          />
         
            <Bar 
            dataKey="interest" 
            stackId="a" 
            fill="#595959"      
            maxBarSize={1}   
            />


        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
