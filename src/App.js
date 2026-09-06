import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import QRCode from 'qrcode';

// =========================================================================
// CONFIGURATION
// =========================================================================
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSth0vcOvDqkZX9KcPKrJk0aPP_NpWSqUjIxUXTIT3pHJnL2hy2Igzv5FX3lOugqxedchSoi3R6V00f/pub?gid=1258406595&single=true&output=csv";
const TEMPLATE_IMAGE_NAME = '/template-payout.png';
// =========================================================================

const getFormattedWibDateTime = () => {
  const now = new Date();
  const optionsDate = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Jakarta' };
  const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' };
  
  const dateStr = now.toLocaleDateString('id-ID', optionsDate);
  const timeStr = now.toLocaleTimeString('id-ID', optionsTime).replace(':', '.');
  
  return `${dateStr}, ${timeStr} WIB`;
};

function App() {
  const [clipperList, setClipperList] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [clipperName, setClipperName] = useState('Diego');
  const [manualNominal, setManualNominal] = useState('10000000');
  const [manualDate, setManualDate] = useState(getFormattedWibDateTime());
  const [discordInvite, setDiscordInvite] = useState('https://discord.gg/rcwv5c5z8u');
  const [totalVideo, setTotalVideo] = useState('100');

  const canvasRef = useRef(null);

  const getFieldValue = (row, possibleKeys) => {
    if (!row) return '';
    for (let key of possibleKeys) {
      const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
      if (foundKey && row[foundKey]) return row[foundKey].trim();
    }
    return '';
  };

  useEffect(() => {
    if (!GOOGLE_SHEETS_CSV_URL || GOOGLE_SHEETS_CSV_URL.includes("2PACX-1v...")) return;

    Papa.parse(GOOGLE_SHEETS_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const validData = results.data.filter(row => {
            const name = getFieldValue(row, ['Nama Lengkap', 'Nama']);
            return name !== '';
          });

          setClipperList(validData);

          const searchParams = new URLSearchParams(window.location.search);
          const rowParam = searchParams.get('row');
          const autoDownload = searchParams.get('autodownload');

          let targetIndex = 0;
          if (rowParam) {
            const calculatedIdx = parseInt(rowParam, 10) - 2;
            if (calculatedIdx >= 0 && calculatedIdx < validData.length) {
              targetIndex = calculatedIdx;
            }
          }

          setSelectedIndex(targetIndex);
          if (validData[targetIndex]) {
            loadClipperData(validData[targetIndex]);
          }

          if (autoDownload === 'true') {
            setTimeout(() => {
              handleDownload();
            }, 800);
          }
        }
      },
      error: (err) => console.error("Error CSV Load:", err)
    });
  }, []);

  const loadClipperData = (clipperRow) => {
    if (!clipperRow) return;

    const sheetName = getFieldValue(clipperRow, ['Nama Lengkap', 'Nama']) || 'Diego';
    
    const tx = getFieldValue(clipperRow, [
      'Total Konten Clipping',
      'Total Transaction',
      'Total Konten',
      'Total Video',
      'Convert Point Engagement'
    ]) || '100';

    // TAMBAHAN: Mencakup header 'Total Payout Clippers' dari Google Sheets
    const rawNominal = getFieldValue(clipperRow, [
      'Total Payout Clippers',
      'Total Payout',
      'Nominal Paid',
      'Nominal Payout',
      'Nominal'
    ]);

    setClipperName(sheetName);
    setTotalVideo(tx);

    if (rawNominal) {
      // Bersihkan karakter non-digit (menghapus Rp, koma, titik, spasi)
      const cleanedNominal = rawNominal.replace(/[^0-9]/g, '');
      if (cleanedNominal) {
        setManualNominal(cleanedNominal);
      }
    }
  };

  const handleSelectClipper = (e) => {
    const idx = parseInt(e.target.value, 10);
    setSelectedIndex(idx);
    if (clipperList[idx]) {
      loadClipperData(clipperList[idx]);
    }
  };

  // RENDER CANVAS CARD
  const renderCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 1. LOAD TEMPLATE BACKGROUND PNG
    const templateImg = new Image();
    templateImg.src = process.env.PUBLIC_URL + TEMPLATE_IMAGE_NAME;

    await new Promise((resolve) => {
      templateImg.onload = () => {
        canvas.width = templateImg.width;
        canvas.height = templateImg.height;
        ctx.drawImage(templateImg, 0, 0);
        resolve();
      };
      templateImg.onerror = () => {
        canvas.width = 1000;
        canvas.height = 562;
        ctx.fillStyle = '#0a0b0d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        resolve();
      };
    });

    // 2. OVERLAY TEKS DINAMIS
    // Nama Clipper (Kiri Atas)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillText(clipperName, 60, 80);

    // Tanggal + Jam WIB (Kanan Atas)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8a94a6';
    ctx.font = '500 16px Inter, sans-serif';
    ctx.fillText(`Date: ${manualDate}`, canvas.width - 60, 80);

    // Label "Total Payout" (Tengah)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9da5b5';
    ctx.font = '500 24px Inter, sans-serif';
    ctx.fillText('Total Payout', canvas.width / 2, 190);

    // Nominal Transfer + Glow Hijau (Tengah)
    const formattedNominal = Number(manualNominal.toString().replace(/[^0-9]/g, '')).toLocaleString('id-ID');
    ctx.save();
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#00ff66';
    ctx.font = 'bold 68px Inter, sans-serif';
    ctx.fillText(`+Rp ${formattedNominal}`, canvas.width / 2, 275);
    ctx.restore();

    // Total Video Clipping (Tengah)
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 22px Inter, sans-serif';
    ctx.fillText(`Total Video Clipping: ${totalVideo}`, canvas.width / 2, 345);

    // 3. LOAD LOGO BOLAMATA & SUB-TEXT (Kiri Bawah)
    const logoImg = new Image();
    logoImg.src = process.env.PUBLIC_URL + '/logo-bolamata.png';

    await new Promise((resolve) => {
      logoImg.onload = () => {
        const logoWidth = 200;
        const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
        const logoX = 60;
        const logoY = canvas.height - 105;
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

        // Sub-teks di bawah logo
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 10px Inter, sans-serif';
        ctx.fillText('Start Clipping & Earn Comissions!', logoX, logoY + logoHeight + 14);
        resolve();
      };
      logoImg.onerror = () => {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px Inter, sans-serif';
        ctx.fillText('BOLAMATA', 60, canvas.height - 75);

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 10px Inter, sans-serif';
        ctx.fillText('Start Clipping & Earn Comissions!', 60, canvas.height - 55);
        resolve();
      };
    });

    // 4. GENERATE QR CODE DISCORD (Kanan Bawah)
    try {
      const fullInviteUrl = discordInvite.startsWith('http') ? discordInvite : `https://${discordInvite}`;
      const qrDataUrl = await QRCode.toDataURL(fullInviteUrl, {
        width: 100,
        margin: 1,
        color: { dark: '#FFFFFF', light: '#00000000' }
      });

      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise((resolve) => {
        qrImg.onload = () => {
          const qrSize = 80;
          const qrX = canvas.width - 140;
          const qrY = canvas.height - 120;
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

          ctx.textAlign = 'right';
          ctx.fillStyle = '#717a8a';
          ctx.font = '11px Inter, sans-serif';
          ctx.fillText(discordInvite.replace(/^https?:\/\//, ''), qrX + qrSize, qrY + qrSize + 16);
          resolve();
        };
      });
    } catch (err) {
      console.error("Error QR Code:", err);
    }
  };

  useEffect(() => {
    renderCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualNominal, manualDate, clipperName, discordInvite, totalVideo, selectedIndex]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    const cleanDate = manualDate.replace(/[/, :.]/g, '_');
    link.download = `PayoutCard_${clipperName.replace(/\s+/g, '_')}_${cleanDate}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#0b0c10', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
        Bolamata Clipper Payout Card Generator
      </h2>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        {/* PANEL INPUT CONTROLS */}
        <div style={{ flex: '1', minWidth: '320px', backgroundColor: '#14161d', padding: '24px', borderRadius: '12px', border: '1px solid #222' }}>
          
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#888', marginBottom: '6px' }}>1. Pilih Clipper dari Google Form:</label>
            <select 
              value={selectedIndex}
              onChange={handleSelectClipper}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#1f242e', color: '#fff', border: '1px solid #333', cursor: 'pointer' }}
            >
              {clipperList.length === 0 ? (
                <option value={0}>Memuat data...</option>
              ) : (
                clipperList.map((item, idx) => {
                  const nama = getFieldValue(item, ['Nama Lengkap', 'Nama']) || `Clipper #${idx+1}`;
                  return <option key={idx} value={idx}>{idx + 1}. {nama}</option>;
                })
              )}
            </select>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#aaa' }}>Nama Lengkap Clipper:</label>
            <input 
              type="text" 
              value={clipperName} 
              onChange={(e) => setClipperName(e.target.value)}
              placeholder="Nama Clipper"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1f242e', color: '#fff', border: '1px solid #333' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#aaa' }}>Link Invite Discord (QR Code):</label>
            <input 
              type="text" 
              value={discordInvite} 
              onChange={(e) => setDiscordInvite(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1f242e', color: '#fff', border: '1px solid #333' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#aaa' }}>Nominal Transfer (Rp):</label>
            <input 
              type="number" 
              value={manualNominal} 
              onChange={(e) => setManualNominal(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1f242e', color: '#fff', border: '1px solid #333' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#aaa' }}>Total Video Clipping:</label>
            <input 
              type="text" 
              value={totalVideo} 
              onChange={(e) => setTotalVideo(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1f242e', color: '#fff', border: '1px solid #333' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#aaa' }}>Tanggal & Waktu Payout:</label>
            <input 
              type="text" 
              value={manualDate} 
              onChange={(e) => setManualDate(e.target.value)}
              placeholder="DD/MM/YYYY, HH.MM WIB"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#1f242e', color: '#fff', border: '1px solid #333' }}
            />
          </div>

          <button 
            onClick={handleDownload}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: '#00ff66', 
              color: '#000', 
              fontWeight: 'bold', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer' 
            }}
          >
            Download Payout Card (.PNG)
          </button>
        </div>

        {/* PREVIEW CANVAS */}
        <div style={{ flex: '2', minWidth: '400px' }}>
          <h3 style={{ marginBottom: '15px', color: '#888' }}>Live Preview Card</h3>
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;