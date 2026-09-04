import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import QRCode from 'qrcode';

// =========================================================================
// CONFIGURATION
// =========================================================================
// Link CSV Publish to Web dari Google Sheets kamu
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSth0vcOvDqkZX9KcPKrJk0aPP_NpWSqUjIxUXTIT3pHJnL2hy2Igzv5FX3lOugqxedchSoi3R6V00f/pub?gid=1258406595&single=true&output=csv";
// =========================================================================

function App() {
  const [clipperList, setClipperList] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [clipperName, setClipperName] = useState('Diego');
  const [manualNominal, setManualNominal] = useState('10000000');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
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

  // 1. FETCH DATA GOOGLE SHEETS
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
          if (validData.length > 0) {
            loadClipperData(validData[0]);
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
      'Total Video'
    ]) || '100';

    const nominal = getFieldValue(clipperRow, [
      'Nominal Paid',
      'Nominal Payout',
      'Nominal'
    ]);

    setClipperName(sheetName);
    setTotalVideo(tx);
    if (nominal) setManualNominal(nominal);
  };

  const handleSelectClipper = (e) => {
    const idx = parseInt(e.target.value, 10);
    setSelectedIndex(idx);
    if (clipperList[idx]) {
      loadClipperData(clipperList[idx]);
    }
  };

  // 2. RENDER CANVAS CARD
  const renderCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Canvas Dimensions (16:9 Aspect Ratio)
    canvas.width = 1000;
    canvas.height = 562;

    // Background Dark Aesthetic
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGradient.addColorStop(0, '#0a0b0d');
    bgGradient.addColorStop(0.5, '#12141a');
    bgGradient.addColorStop(1, '#07080a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Glow Effect Background
    ctx.save();
    const glowGradient = ctx.createRadialGradient(850, 100, 10, 850, 100, 300);
    glowGradient.addColorStop(0, 'rgba(0, 255, 102, 0.08)');
    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(850, 100, 300, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // -----------------------------------------------------------------
    // HEADER SECTION (Nama Clipper & Tanggal)
    // -----------------------------------------------------------------
    // Nama Clipper (Kiri Atas)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillText(clipperName, 60, 80);

    // Tanggal (Kanan Atas)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8a94a6';
    ctx.font = '500 18px Inter, sans-serif';
    ctx.fillText(`Date: ${manualDate}`, 940, 80);

    // -----------------------------------------------------------------
    // MAIN PAYOUT SECTION (Tengah)
    // -----------------------------------------------------------------
    ctx.textAlign = 'center';
    
    // Label Total Payout
    ctx.fillStyle = '#9da5b5';
    ctx.font = '500 24px Inter, sans-serif';
    ctx.fillText('Total Payout', canvas.width / 2, 190);

    // Angka Nominal Transfer + Effect Glow Hijau
    const formattedNominal = Number(manualNominal.toString().replace(/[^0-9]/g, '')).toLocaleString('id-ID');
    ctx.save();
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#00ff66';
    ctx.font = 'bold 68px Inter, sans-serif';
    ctx.fillText(`+Rp ${formattedNominal}`, canvas.width / 2, 275);
    ctx.restore();

    // Total Video Clipping
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 22px Inter, sans-serif';
    ctx.fillText(`Total Video Clipping: ${totalVideo}`, canvas.width / 2, 345);

    // -----------------------------------------------------------------
    // FOOTER SECTION (Separator, Logo Image, Instagram & QR Code)
    // -----------------------------------------------------------------
    // Separator Line
    ctx.beginPath();
    ctx.moveTo(60, 420);
    ctx.lineTo(940, 420);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Kiri Bawah: Load Logo BOLAMATA
    const logoImg = new Image();
    // Path/URL logo kamu (atau simpan gambar logo di folder /public/logo-bolamata.png)
    logoImg.src = '/logo-bolamata.png'; 

    await new Promise((resolve) => {
      logoImg.onload = () => {
        // Crop/Render bagian tulisan BOLAMATA saja (Memilih bagian kiri logo)
        const logoWidth = 240;
        const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
        ctx.drawImage(logoImg, 60, 435, logoWidth, logoHeight);
        resolve();
      };
      // Fallback jika logo belum ter-load/error (Render via Text Custom Styling)
      logoImg.onerror = () => {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px Inter, sans-serif';
        ctx.fillText('BOLAMATA', 60, 462);
        resolve();
      };
    });

    // Tagline / Kata-kata ajakan
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15px Inter, sans-serif';
    ctx.fillText('Start Clipping & Earn Commissions!', 60, 500);


    // Kanan Bawah: QR Code Generator
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
          const qrX = 860;
          const qrY = 435;
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
    const link = document.createElement('a');
    link.download = `PayoutCard_${clipperName.replace(/\s+/g, '_')}_${manualDate}.png`;
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
            <label style={{ display: 'block', fontSize: '13px', color: '#aaa' }}>Tanggal Payout:</label>
            <input 
              type="date" 
              value={manualDate} 
              onChange={(e) => setManualDate(e.target.value)}
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