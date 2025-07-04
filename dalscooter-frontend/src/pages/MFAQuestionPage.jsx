import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

function MFAQuestionPage() {
  const navigate = useNavigate();

  const handleSubmit = e => {
    e.preventDefault();
    // TODO: Verify answer

    //mock check
    if (e.target[0].value.trim().toLowerCase() === 'fluffy') {
        navigate('/mfa-caesar');
    } else {
        alert('Incorrect answer');
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Step 1: Security Question</h2>
        <form onSubmit={handleSubmit}>
          <p>What is your pet’s name?</p>
          <input placeholder="Your Answer (fluffy)" required />
          <button type="submit">Continue</button>
        </form>
      </div>
    </>
  );
}

export default MFAQuestionPage;
