import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode.react';
import Barcode from 'react-barcode';
import { fetchLocations } from '../api';
import { Location } from '../types';

export default function PrintView() {
  const [params] = useSearchParams();
  const [locations, setLocations] = useState<Location[]>([]);
  
  useEffect(() => {
    const ids = params.get('ids')?.split(',') || [];
    fetchLocations().then(res => {
      setLocations(res.data.filter(l => ids.includes(l.id)));
    });
  }, [params]);

  const type = params.get('type') || 'qr';

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <style>{`@media print { button { display: none; } }`}</style>
      <button onClick={() => window.print()} style={{marginBottom: 20, fontSize: 16, padding: '8px 16px'}}>Print</button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {locations.map(l => (
          <div key={l.id} style={{ border: '1px solid #ccc', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', pageBreakInside: 'avoid' }}>
            <h3 style={{marginBottom: 10, textAlign: 'center'}}>{l.fullPath}</h3>
            {type === 'qr' ? (
               <QRCode value={l.id} size={128} />
            ) : (
               <Barcode value={l.id} width={1.5} height={50} fontSize={12} />
            )}
            <p style={{fontSize: 10, color: '#666', marginTop: 5}}>{l.id}</p>
          </div>
        ))}
      </div>
    </div>
  );
}