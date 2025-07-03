import Navbar from '../components/Navbar';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function MFACaesarPage() {
  const [encrypted, setEncrypted] = useState('');
  const original = 'dal scooter';
  const navigate = useNavigate();

  useEffect(() => {
    const enc = original.replace(/[a-zA-Z]/g, char => {
      const base = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - base + 3) % 26) + base);
    });
    setEncrypted(enc);
  }, []);

  const handleSubmit = e => {
    e.preventDefault();
    // TODO: Validate Caesar input
    navigate('/customer-home');
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Step 2: Decryption Challenge</h2>
        <p>Decrypt this:</p>
        <p><code>{encrypted}</code></p>
        <form onSubmit={handleSubmit}>
          <input placeholder="Your decryption" required />
          <button type="submit">Submit</button>
        </form>
      </div>
    </>
  );
}

export default MFACaesarPage;
