import Navbar from '../components/Navbar';

function HomePage() {
  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Welcome to <span style={{ color: '#32746D' }}>DALScooter</span></h2>
        <p>Book and ride eco-friendly scooters across campus using secure authentication.</p>
      </div>
    </>
  );
}
export default HomePage;
