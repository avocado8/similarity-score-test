import { useState } from 'react'
import { DrawingGame } from './components/DrawingGame'
import { DataPreview } from './components/DataPreview'
import './App.css'

function App() {
  const [view, setView] = useState<'game' | 'preview'>('game');

  return (
    <>
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #ddd', background: '#f9f9f9' }}>
        <button 
          onClick={() => setView('game')}
          style={{ 
            marginRight: '10px', 
            fontWeight: view === 'game' ? 'bold' : 'normal',
            padding: '8px 16px',
            backgroundColor: view === 'game' ? '#2196F3' : 'white',
            color: view === 'game' ? 'white' : 'black',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          게임
        </button>
        <button 
          onClick={() => setView('preview')}
          style={{ 
            fontWeight: view === 'preview' ? 'bold' : 'normal',
             padding: '8px 16px',
            backgroundColor: view === 'preview' ? '#2196F3' : 'white',
            color: view === 'preview' ? 'white' : 'black',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          데이터 미리보기
        </button>
      </div>
      {view === 'game' ? <DrawingGame /> : <DataPreview />}
    </>
  )
}

export default App
