import Navbar from '../components/Navbar';

function CustomerHomePage() {
  return (
    <>
      <Navbar />
      <div className="container">
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontWeight: 700 }}>
          Welcome to <span style={{ color: '#d46338', letterSpacing: '0.02em' }}>DALScooter</span>!
        </h2>
        <p style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          You are successfully logged in as a registered customer.
        </p>
        <div style={{ marginTop: '2rem', width: '100%' }}>
          <h4 style={{ color: '#d46338', fontWeight: 600, marginBottom: '1rem', textAlign: 'center' }}>Your Dashboard</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--text-dark)', fontSize: '1.08rem', lineHeight: 1.7 }}>
            <li>View available scooters near you</li>
            <li>Check your ride history</li>
            <li>Update your profile</li>
            <li>Start a new ride</li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default CustomerHomePage;
