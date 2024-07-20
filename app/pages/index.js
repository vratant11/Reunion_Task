import React from 'react';
import DataTable from '../components/DataTable';
import sampleData from '../components/data/sampleData';

const Main = () => {
  return (
    <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#f9f9f9' }}>
      <h1 style={{ 
        fontSize: '2.5rem', 
        fontWeight: '700', 
        color: '#2c3e50', 
        margin: '0 0 20px', 
        padding: '10px 20px',
        borderBottom: '3px solid #3498db',
        borderRadius: '5px',
        display: 'inline-block',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      }}>
        Data Table
      </h1>
      <DataTable data={sampleData} />
    </div>
  );
};

export default Main;
