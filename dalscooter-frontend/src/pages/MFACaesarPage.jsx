import Navbar from '../components/Navbar';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function MFACaesarPage() {
  const [encrypted, setEncrypted] = useState('');
  const original = 'dal scooter';
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const enc = original.replace(/[a-zA-Z]/g, char => {
      const base = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - base + 3) % 26) + base);
    });
    setEncrypted(enc);
  }, []);

  const handleSubmit = e => {
    const userAnswer = e.target[0].value.trim().toLowerCase();

    if (userAnswer === original) {
      // TODO: Validate Caesar input
      login(); 
      navigate('/customer-home');
    } else {
      alert('Incorrect decryption. Try again!');
    }
  };

  return (
    <>
      {/* <Navbar />
      <div className="container">
        <h2>Step 2: Decryption Challenge</h2>
        <p>Decrypt this:</p>
        <p><code>{encrypted}</code></p>
        <form onSubmit={handleSubmit}>
          <input placeholder="Your decryption (dal scooter)" required />
          <button type="submit">Submit</button>
        </form>
      </div>
    </> */}
    <Navbar />
      <div className="container">
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Step 2: Decryption Challenge</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 500, marginBottom: '0.5rem' }}>
          Decrypt this:
        </p>
        <p style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.04em', color: 'var(--accent)', marginBottom: '1.2rem' }}>
          <code>{encrypted}</code>
        </p>
        <form onSubmit={handleSubmit}>
          <input placeholder="Your decryption (dal scooter)" required />
          <button type="submit" >Submit</button>
        </form>
      </div>
    </>
  );
}

export default MFACaesarPage;
