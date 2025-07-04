import Navbar from '../components/Navbar';

function CustomerHomePage() {
  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Welcome to DALScooter!</h2>
        <p>You are successfully logged in as a registered customer.</p>

        <div style={{ marginTop: '2rem' }}>
          <h4>Your Dashboard</h4>
          <ul>
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
