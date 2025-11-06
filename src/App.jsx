import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  // Data and loading states
  const [sentences, setSentences] = useState([]);
  const [loadingButton, setLoadingButton] = useState(null); // Can be 'hanji', 'lomaji', or null
  const [history, setHistory] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  // State for the single selected sentence pair
  const [currentSentence, setCurrentSentence] = useState(null);
  
  // States for the two correction inputs
  const [hanjiCorrection, setHanjiCorrection] = useState('');
  const [lomajiCorrection, setLomajiCorrection] = useState('');

  // Initial data load
  useEffect(() => {
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
    fetchHistory();
  }, []);

  // --- Core Logic ---

  const getRandomSentence = () => {
    if (sentences.length > 0) {
      const randomIndex = Math.floor(Math.random() * sentences.length);
      setCurrentSentence(sentences[randomIndex]);
      setHanjiCorrection('');
      setLomajiCorrection('');
      setSelectedHistoryId(null); // Reset editing state
    }
  };

  const playTTS = async (textToSynthesize, buttonId, ttsLang) => {
    if (!textToSynthesize) return;
    setLoadingButton(buttonId);
    try {
      const response = await fetch('https://dev.taigiedu.com/backend/synthesize_speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tts_lang: ttsLang, tts_data: textToSynthesize }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const base64Audio = await response.text();
      console.log('Raw base64 response:', base64Audio);

      // Decode base64 string
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log('Decoded bytes:', bytes);

      const audioBlob = new Blob([bytes], { type: 'audio/wav' });
      if (audioBlob.size > 0) {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      } else {
        throw new Error('Received empty audio data after decoding.');
      }
    } catch (error) {
      console.error('Error fetching TTS:', error);
      alert(`語音合成失敗: ${error.message}`);
    } finally {
      setLoadingButton(null);
    }
  };

  const playHTS = async (textToSynthesize, buttonId) => {
    if (!textToSynthesize) return;
    setLoadingButton(buttonId);
    try {
      const response = await fetch('/hts-api/HTS_taiwanese_synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'tailuo',
          chi_string: textToSynthesize,
          hts_model: 'M12_5'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.audio_path_sandhi) {
        const audioUrl = `http://140.116.245.147:30011/${result.audio_path_sandhi}`;
        const audio = new Audio(audioUrl);
        audio.play();
      } else {
        throw new Error('Audio path not found in API response.');
      }
    } catch (error) {
      console.error('Error fetching HTS TTS:', error);
      alert(`HTS 語音合成失敗: ${error.message}`);
    } finally {
      setLoadingButton(null);
    }
  };

  const saveCorrections = async () => {
    if (!currentSentence) {
      alert('請先抽選句子');
      return;
    }

    let error;

    if (selectedHistoryId) {
      // Update existing record with only the correction fields
      const updateData = {
        hanji_correction: hanjiCorrection,
        lomaji_correction: lomajiCorrection,
      };
      const { data, error: updateError } = await supabase
        .from('tts_corrections')
        .update(updateData)
        .eq('id', selectedHistoryId);
      
      console.log('Supabase update response:', { data, error: updateError });
      error = updateError;
    } else {
      // Insert new record with all fields
      const insertData = {
        original_hanji: currentSentence.hanji,
        original_lomaji: currentSentence.lomaji,
        hanji_correction: hanjiCorrection,
        lomaji_correction: lomajiCorrection,
      };
      const { error: insertError } = await supabase
        .from('tts_corrections')
        .insert([insertData]);
      error = insertError;
    }

    if (error) {
      console.error('Error saving corrections:', error);
      alert('儲存失敗');
    } else {
      alert('儲存成功！');
      setHanjiCorrection('');
      setLomajiCorrection('');
      setSelectedHistoryId(null); // Reset editing state
      fetchHistory(); // Refresh history
    }
  };

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

  const handleHistoryClick = (item) => {
    setCurrentSentence({
      hanji: item.original_hanji,
      lomaji: item.original_lomaji,
    });
    setHanjiCorrection(item.hanji_correction || '');
    setLomajiCorrection(item.lomaji_correction || '');
    setSelectedHistoryId(item.id);
  };

  const deleteCorrection = async (id) => {
    if (!window.confirm('確定要刪除這筆紀錄嗎？')) {
      return;
    }

    const { error } = await supabase
      .from('tts_corrections')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting correction:', error);
      alert('刪除失敗');
    } else {
      fetchHistory(); // Refresh the list after successful deletion
    }
  };

  // --- Render ---
  return (
    <div className="container">
      <div className="main-content">
        <button onClick={getRandomSentence} className="main-action-btn">抽一句</button>

        <div className="sentence-columns-container">
          {/* Hanji Column */}
          <div className="sentence-column">
            <h3>漢字</h3>
            {currentSentence && (
              <>
                <div className="sentence-display">
                  <p className="hanji">{currentSentence.hanji}</p>
                </div>
                <button onClick={() => playTTS(currentSentence.hanji, 'hanji', 'tw')} disabled={loadingButton === 'hanji'}>
                  {loadingButton === 'hanji' ? '載入中...' : '播放'}
                </button>
                <textarea
                  rows="4"
                  placeholder="請輸入漢字的修正..."
                  value={hanjiCorrection}
                  onChange={(e) => setHanjiCorrection(e.target.value)}
                />
              </>
            )}
          </div>

          {/* Lomaji Column */}
          <div className="sentence-column">
            <h3>羅馬字</h3>
            {currentSentence && (
              <>
                <div className="sentence-display">
                  <p className="lomaji">{currentSentence.lomaji}</p>
                </div>
                <div className="button-group">
                  <button onClick={() => playTTS(currentSentence.lomaji, 'vits', 'tb')} disabled={loadingButton === 'vits'}>
                    {loadingButton === 'vits' ? '載入中...' : 'VITS'}
                  </button>
                  <button onClick={() => playHTS(currentSentence.lomaji, 'hts')} disabled={loadingButton === 'hts'}>
                    {loadingButton === 'hts' ? '載入中...' : 'HTS'}
                  </button>
                </div>
                <textarea
                  rows="4"
                  placeholder="請輸入羅馬字的修正..."
                  value={lomajiCorrection}
                  onChange={(e) => setLomajiCorrection(e.target.value)}
                />
              </>
            )}
          </div>
        </div>

        <button 
          onClick={saveCorrections} 
          className="main-action-btn"
          disabled={!currentSentence || (!hanjiCorrection && !lomajiCorrection)}
        >
          儲存修正
        </button>
      </div>

      <div className="sidebar">
        <h3>修正紀錄</h3>
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className="history-item" onClick={() => handleHistoryClick(item)}>
                              <button 
                                className="delete-btn" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCorrection(item.id);
                                }}
                              >
                                X
                              </button>              <p><strong>原句:</strong> {item.original_hanji}</p>
              <p><strong>羅馬字:</strong> {item.original_lomaji}</p>
              <hr />
              {item.hanji_correction && <p><strong>漢字修正:</strong> {item.hanji_correction}</p>}
              {item.lomaji_correction && <p><strong>羅馬字修正:</strong> {item.lomaji_correction}</p>}
              <p className="timestamp">{new Date(item.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;