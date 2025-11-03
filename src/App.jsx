import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [sentences, setSentences] = useState([]);
  const [currentSentence, setCurrentSentence] = useState(null);
  const [correction, setCorrection] = useState('');
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch sentences from CSV
    fetch(`${import.meta.env.BASE_URL}leku_list.csv`)
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data.map(row => ({
              hanji: row['漢字'],
              lomaji: row['羅馬字']
            })).filter(row => row.hanji && row.lomaji);
            setSentences(data);
          }
        });
      });

    // Fetch initial history from Supabase
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('tts_corrections')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching history:', error);
    } else {
      setHistory(data);
    }
  };

  const getRandomSentence = () => {
    if (sentences.length > 0) {
      const randomIndex = Math.floor(Math.random() * sentences.length);
      setCurrentSentence(sentences[randomIndex]);
      setCorrection('');
    }
  };

  const playTTS = async () => {
    if (!currentSentence) return;
    setIsLoading(true);
    try {
      const response = await fetch('https://dev.taigiedu.com/backend/synthesize_speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tts_lang: 'tb', tts_data: currentSentence.lomaji }),
      });
      const data = await response.json();
      if (data.result) {
        const binaryString = atob(data.result);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error('Error fetching TTS:', error);
      alert('語音合成失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const saveCorrection = async () => {
    if (!currentSentence || !correction) {
      alert('沒有原句或修正內容');
      return;
    }
    const { error } = await supabase
      .from('tts_corrections')
      .insert([
        {
          hanji: currentSentence.hanji,
          lomaji: currentSentence.lomaji,
          correction: correction,
        }
      ]);

    if (error) {
      console.error('Error saving correction:', error);
      alert('儲存失敗');
    } else {
      alert('儲存成功！');
      setCorrection('');
      fetchHistory(); // Refresh history
    }
  };

  return (
    <div className="container">
      <div className="main-content">
        <div className="controls">
          <button onClick={getRandomSentence}>抽一句</button>
          <button onClick={playTTS} disabled={!currentSentence || isLoading}>
            {isLoading ? '載入中...' : '播放'}
          </button>
        </div>
        {currentSentence && (
          <div className="sentence-display">
            <p className="hanji">{currentSentence.hanji}</p>
            <p className="lomaji">{currentSentence.lomaji}</p>
          </div>
        )}
        <div className="correction-area">
          <textarea
            rows="4"
            placeholder="請輸入修正內容..."
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            disabled={!currentSentence}
          />
          <button onClick={saveCorrection} disabled={!currentSentence || !correction}>儲存</button>
        </div>
      </div>
      <div className="sidebar">
        <h3>修正紀錄</h3>
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className="history-item">
              <p><strong>原句:</strong> {item.hanji} ({item.lomaji})</p>
              <p><strong>修正:</strong> {item.correction}</p>
              <p className="timestamp">{new Date(item.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;